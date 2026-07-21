"""
Pipeline Controller — the single orchestration layer for the UrjaNetra AI intelligence pipeline.

Responsibilities:
  - Accept ExecutionContext (scenario, demo step, trigger, IDs)
  - Resolve execution order via DAG dependency map (improvement #4)
  - Pass ExecutionContext to every engine (improvement #5)
  - Validate state before/after each engine
  - Enforce intelligent caching (skip Procurement/Compatibility when Risk unchanged)
  - Publish events to the EventBus
  - Collect observability metrics
  - Maintain state history
  - Return a finalized, immutable PipelineState

Design rules:
  - Decision Engine is purely deterministic (improvement #1)
  - Executive Engine is purely deterministic (improvement #2)
  - ai_extensions section reserved for future AI layers (improvement #3)
"""
import time
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List

from app.pipeline.models import PipelineState, PipelineMetadata, ExecutionContext
from app.pipeline.event_bus import event_bus
from app.pipeline.pipeline_validator import (
    validate_pre_execution, validate_post_execution, validate_dag, ValidationError
)
from app.pipeline.history import history_manager
from app.pipeline.metrics import metrics
from app.pipeline.serializer import deep_copy, diff

# ─── Engine Imports (direct module imports — avoid package-level circular imports) ──
from app.core import scenario_engine
from app.core import risk_engine
from app.core import economic_engine
from app.core import timeline_engine
from app.core import procurement_engine
from app.core import compatibility_engine
from app.core import spr_engine
from app.core import compliance_engine
from app.core import decision_engine
from app.core import notification_generator
from app.core import audit_generator
from app.core import executive_engine

logger = logging.getLogger("urjanetra.pipeline.controller")

# ─── DAG Dependency Map (improvement #4) ────────────────────────────────────
# Key = engine name, Value = list of engines that must complete first.
ENGINE_DEPENDENCY_MAP: Dict[str, List[str]] = {
    "Scenario":        [],
    "Risk":            ["Scenario"],
    "Economic":        ["Scenario"],
    "Timeline":        ["Scenario"],
    "Procurement":     ["Scenario", "Risk"],
    "Compatibility":   ["Procurement"],
    "SPR":             ["Procurement"],
    "Compliance":      ["Procurement"],
    "Decision":        ["Compliance"],
    "Notifications":   ["Decision"],
    "Audit":           ["Notifications"],
    "Executive":       ["Audit", "Economic", "Timeline", "SPR", "Compatibility"],
}

# Engine name → module mapping
ENGINE_MODULES: Dict[str, Any] = {
    "Scenario":      scenario_engine,
    "Risk":          risk_engine,
    "Economic":      economic_engine,
    "Timeline":      timeline_engine,
    "Procurement":   procurement_engine,
    "Compatibility": compatibility_engine,
    "SPR":           spr_engine,
    "Compliance":    compliance_engine,
    "Decision":      decision_engine,
    "Notifications": notification_generator,
    "Audit":         audit_generator,
    "Executive":     executive_engine,
}

# Event names published after each engine completes
ENGINE_EVENTS: Dict[str, str] = {
    "Scenario":      "ScenarioActivated",
    "Risk":          "RiskUpdated",
    "Economic":      "EconomicUpdated",
    "Timeline":      "TimelineUpdated",
    "Procurement":   "ProcurementUpdated",
    "Compatibility": "CompatibilityUpdated",
    "SPR":           "SPRUpdated",
    "Compliance":    "ComplianceUpdated",
    "Decision":      "DecisionUpdated",
    "Notifications": "NotificationsGenerated",
    "Audit":         "AuditGenerated",
    "Executive":     "PipelineCompleted",
}

# Validate DAG on module load (fail fast if someone introduces a cycle)
validate_dag(ENGINE_DEPENDENCY_MAP)


def _topological_sort(dep_map: Dict[str, List[str]]) -> List[str]:
    """
    Kahn's algorithm — resolves engine execution order from dependency map.
    Returns a list of engine names in safe execution order.
    """
    in_degree = {node: 0 for node in dep_map}
    for node, deps in dep_map.items():
        for dep in deps:
            in_degree[node] = in_degree.get(node, 0) + 1

    # Recalculate: for each node, count how many deps it has
    in_degree = {node: len(deps) for node, deps in dep_map.items()}
    ready = [node for node, deg in in_degree.items() if deg == 0]
    order = []

    while ready:
        ready.sort()  # Deterministic ordering within the same level
        node = ready.pop(0)
        order.append(node)
        for candidate, deps in dep_map.items():
            if node in deps:
                in_degree[candidate] -= 1
                if in_degree[candidate] == 0:
                    ready.append(candidate)

    if len(order) != len(dep_map):
        raise ValueError("Engine DAG has cycles — topological sort failed.")
    return order


# Pre-compute execution order at import time
EXECUTION_ORDER = _topological_sort(ENGINE_DEPENDENCY_MAP)
logger.info(f"Engine execution order resolved: {' → '.join(EXECUTION_ORDER)}")


class PipelineController:
    """
    The single orchestration layer. One shared instance per process.
    Thread-safe via per-execution locking.
    """
    _instance = None
    _singleton_lock = threading.Lock()

    def __new__(cls):
        with cls._singleton_lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._cache: Dict[str, Any] = {}
                cls._instance._cache_lock = threading.Lock()
        return cls._instance

    # ── Cache helpers ─────────────────────────────────────────────────────────

    def _cache_key(self, engine_name: str, scenario_id: Optional[str], demo_step: int) -> str:
        return f"{engine_name}::{scenario_id}::{demo_step}"

    def _get_cache(self, engine_name: str, scenario_id: Optional[str], demo_step: int) -> Optional[Any]:
        key = self._cache_key(engine_name, scenario_id, demo_step)
        with self._cache_lock:
            return self._cache.get(key)

    def _set_cache(self, engine_name: str, scenario_id: Optional[str],
                   demo_step: int, value: Any) -> None:
        key = self._cache_key(engine_name, scenario_id, demo_step)
        with self._cache_lock:
            self._cache[key] = value

    def invalidate(self) -> None:
        """Clear all cached engine outputs (called on scenario change or reset)."""
        with self._cache_lock:
            self._cache.clear()
        logger.info("Pipeline cache invalidated.")

    # ── Core execution ────────────────────────────────────────────────────────

    def run(self, context: ExecutionContext,
            db_audit_summary: Optional[dict] = None,
            db_latest_decision: Optional[dict] = None,
            db_activated_at: Any = None) -> PipelineState:
        """
        Execute the full intelligence pipeline from Scenario → Executive.

        Args:
            context: ExecutionContext carrying all execution metadata.
            db_audit_summary: Audit count summary from the DB (injected by router).
            db_latest_decision: Latest decision record from the DB (injected by router).
            db_activated_at: Activation datetime for elapsed-time calculation.

        Returns:
            Fully populated, immutable PipelineState.
        """
        exec_start = metrics.record_execution_start(context.execution_id)
        logger.info(
            f"Pipeline run started | execution_id={context.execution_id} "
            f"scenario={context.scenario_id} step={context.demo_step} trigger={context.trigger}"
        )

        # Attach DB-sourced data to context for engines that need them
        context.__dict__["audit_summary"] = db_audit_summary or {}
        context.__dict__["latest_decision"] = db_latest_decision or {}
        context.__dict__["activated_at"] = db_activated_at

        # Build fresh state
        state = PipelineState(
            metadata=PipelineMetadata(
                version=len(history_manager) + 1,
                timestamp=context.timestamp,
                scenario_id=context.scenario_id,
                demo_step=context.demo_step,
                execution_id=context.execution_id,
                correlation_id=context.correlation_id,
            )
        )

        # Check whether Risk inputs changed — drives downstream caching
        risk_cache_key = self._cache_key("Risk", context.scenario_id, context.demo_step)
        risk_changed = risk_cache_key not in self._cache

        skipped = []

        for engine_name in EXECUTION_ORDER:
            module = ENGINE_MODULES[engine_name]
            scenario_id = context.scenario_id
            demo_step = context.demo_step

            # ── Intelligent caching
            # If Risk did not change, skip Procurement (and its dependents) by reusing cache
            if engine_name == "Procurement" and not risk_changed:
                cached = self._get_cache("Procurement", scenario_id, demo_step)
                if cached is not None:
                    metrics.record_cache_hit("Procurement")
                    metrics.record_skip("Procurement")
                    skipped.append("Procurement")
                    state.procurement = cached
                    # Also restore Compatibility, SPR, Compliance from cache
                    for downstream in ("Compatibility", "SPR", "Compliance"):
                        dc = self._get_cache(downstream, scenario_id, demo_step)
                        if dc is not None:
                            setattr(state, downstream.lower(), dc)
                            skipped.append(downstream)
                    continue
                else:
                    metrics.record_cache_miss("Procurement")

            if engine_name in skipped:
                continue

            # ── Validate before
            try:
                validate_pre_execution(state, engine_name)
            except ValidationError as e:
                metrics.record_failure(engine_name, str(e))
                logger.error(f"Pre-validation failed for {engine_name}: {e}")
                # Return current (partial) state — pipeline remains valid
                break

            # ── Execute
            engine_start = time.perf_counter()
            try:
                state = module.execute(state, context)
            except Exception as e:
                metrics.record_failure(engine_name, str(e))
                logger.error(f"Engine {engine_name} raised exception: {e}", exc_info=True)
                # Continue — state remains valid at last checkpoint
                continue
            finally:
                elapsed_ms = (time.perf_counter() - engine_start) * 1000
                metrics.record_engine_time(engine_name, elapsed_ms)

            # ── Validate after
            try:
                validate_post_execution(state, engine_name)
            except ValidationError as e:
                metrics.record_failure(engine_name, str(e))
                logger.error(f"Post-validation failed for {engine_name}: {e}")
                break

            # ── Cache outputs for reuse
            if engine_name == "Risk":
                self._set_cache("Risk", scenario_id, demo_step, state.risk)
            elif engine_name in ("Procurement", "Compatibility", "SPR", "Compliance"):
                self._set_cache(engine_name, scenario_id, demo_step,
                                getattr(state, engine_name.lower()))

            # ── Publish event
            event_bus.publish(ENGINE_EVENTS.get(engine_name, engine_name), {
                "engine": engine_name,
                "execution_id": context.execution_id,
                "scenario_id": context.scenario_id,
            })

            logger.debug(f"Engine {engine_name} completed in {elapsed_ms:.1f}ms")

        # ── Push to history
        history_manager.push(state)

        # ── Record total execution time
        metrics.record_execution_end(exec_start)

        logger.info(
            f"Pipeline run complete | execution_id={context.execution_id} "
            f"version={state.metadata.version} "
            f"skipped={skipped}"
        )
        return state


# ─── Singleton Controller ────────────────────────────────────────────────────
controller = PipelineController()
