"""
Pipeline Validator — pre/post engine state validation.
Checks required fields, schema consistency, timestamp integrity,
execution order compliance, and missing dependencies.
"""
import logging
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger("urjanetra.pipeline.validator")


class ValidationError(Exception):
    """Raised when PipelineState fails validation."""
    def __init__(self, engine: str, reason: str):
        self.engine = engine
        self.reason = reason
        super().__init__(f"[{engine}] Validation failed: {reason}")


def validate_pre_execution(state: any, engine_name: str) -> None:
    """
    Validate that state is ready for an engine to execute.
    Raises ValidationError if state is invalid.
    """
    if state is None:
        raise ValidationError(engine_name, "PipelineState is None before execution")

    if state.metadata is None:
        raise ValidationError(engine_name, "PipelineState.metadata is missing")

    if state.metadata.execution_id is None or state.metadata.execution_id == "":
        raise ValidationError(engine_name, "PipelineState.metadata.execution_id is empty")

    logger.debug(f"[{engine_name}] Pre-execution validation passed. "
                 f"execution_id={state.metadata.execution_id}")


def validate_post_execution(state: any, engine_name: str) -> None:
    """
    Validate that state is consistent after an engine has executed.
    Raises ValidationError if state is invalid.
    """
    if state is None:
        raise ValidationError(engine_name, "PipelineState is None after execution")

    # Timestamp integrity — must be a valid ISO timestamp
    ts = state.metadata.timestamp
    if ts:
        try:
            datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except ValueError:
            raise ValidationError(engine_name,
                f"metadata.timestamp is not a valid ISO timestamp: {ts}")

    # Scenario ID consistency — executive section must match metadata
    if state.metadata.scenario_id != state.executive.active_scenario:
        # Only fail after executive engine has run (active_scenario may be None before)
        if engine_name == "Executive":
            raise ValidationError(engine_name,
                f"Scenario ID mismatch: metadata={state.metadata.scenario_id}, "
                f"executive={state.executive.active_scenario}")

    # Risk score must be in valid range 0–100
    if not (0 <= state.risk.overall_score <= 100):
        raise ValidationError(engine_name,
            f"risk.overall_score={state.risk.overall_score} is out of range [0, 100]")

    logger.debug(f"[{engine_name}] Post-execution validation passed.")


def validate_dag(dependency_map: dict) -> None:
    """
    Validate that the dependency map forms a valid DAG (no cycles).
    Raises ValueError if a cycle is detected.
    """
    visited = set()
    rec_stack = set()

    def dfs(node):
        visited.add(node)
        rec_stack.add(node)
        for dep in dependency_map.get(node, []):
            if dep not in visited:
                dfs(dep)
            elif dep in rec_stack:
                raise ValueError(f"Cycle detected in engine DAG at node '{dep}'")
        rec_stack.discard(node)

    for node in dependency_map:
        if node not in visited:
            dfs(node)

    logger.info("Engine DAG validated — no cycles detected.")
