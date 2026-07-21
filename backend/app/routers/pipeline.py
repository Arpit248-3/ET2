"""
Pipeline Router — state history, diff, reset, metrics, and legacy compatibility endpoints.

Phase 2 endpoints:
  GET  /api/state/history     → list of previous pipeline state versions
  GET  /api/state/diff        → diff between two most recent states
  POST /api/state/reset       → flush history, invalidate cache, re-run

Observability:
  GET  /api/pipeline/metrics

Legacy (backward compatible):
  GET  /api/pipeline/state    → delegates to Pipeline Controller
  POST /api/pipeline/run      → triggers controller, returns state
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ScenarioState, Decision, AuditLog
from app.pipeline.controller import controller
from app.pipeline.history import history_manager
from app.pipeline.metrics import metrics
from app.pipeline.serializer import diff
from app.pipeline.models import ExecutionContext

logger = logging.getLogger("urjanetra.routers.pipeline")
router = APIRouter()


# ─── Shared helper ───────────────────────────────────────────────────────────

def _build_context(db: Session, trigger: str = "USER") -> ExecutionContext:
    """Fetch current scenario/step from DB and construct an ExecutionContext."""
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None
    demo_step = state.demo_step if state else 0
    return ExecutionContext(
        scenario_id=scenario_id,
        demo_step=demo_step,
        trigger=trigger,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


def _db_audit_summary(db: Session) -> dict:
    total = db.query(AuditLog).count()
    latest = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    return {
        "total_count": total,
        "last_updated": latest.timestamp.isoformat() if latest and latest.timestamp else None,
        "latest_action": latest.action if latest else None,
    }


def _db_latest_decision(db: Session) -> dict:
    dec = db.query(Decision).order_by(Decision.id.desc()).first()
    if dec:
        return {
            "decision_id": dec.decision_id,
            "timestamp": dec.timestamp.isoformat() if dec.timestamp else None,
            "scenario_id": dec.scenario_id,
            "action_type": dec.action_type,
            "approved_by": dec.approved_by,
            "details": dec.details,
            "status": dec.status,
        }
    return {}


def _db_activated_at(db: Session):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if state and state.activated_at:
        dt = state.activated_at
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
    return None


def _run_pipeline(db: Session, trigger: str = "USER") -> dict:
    """Execute the pipeline and return the serialized state dict."""
    context = _build_context(db, trigger)
    state = controller.run(
        context=context,
        db_audit_summary=_db_audit_summary(db),
        db_latest_decision=_db_latest_decision(db),
        db_activated_at=_db_activated_at(db),
    )
    # Persist to legacy PipelineResult table for backward compat
    from app.models import PipelineResult
    from app.pipeline.serializer import serialize
    result_dict = serialize(state)

    # Add legacy top-level fields expected by the old frontend adapter
    result_dict["active_scenario_id"] = context.scenario_id
    result_dict["demo_step"] = context.demo_step
    result_dict["generated_at"] = context.timestamp
    # Map executive section into legacy keys
    exec_sec = result_dict.get("executive", {})
    result_dict["state"] = {
        "kpi": exec_sec.get("kpi", {}),
        "incident_feed": exec_sec.get("incident_feed", []),
        "risk_signals": exec_sec.get("risk_signals", []),
        "active_scenario": context.scenario_id,
        "demo_step": context.demo_step,
        "brent_price": exec_sec.get("brent_price", 88.0),
        "timestamp": context.timestamp,
    }
    result_dict["demo"] = exec_sec.get("demo", {})
    result_dict["brief"] = exec_sec.get("brief", {})
    result_dict["latest_decision"] = _db_latest_decision(db)
    result_dict["audit_summary"] = _db_audit_summary(db)
    result_dict["active_scenario"] = state.scenario or {}

    db_result = db.query(PipelineResult).filter(PipelineResult.id == 1).first()
    if not db_result:
        db_result = PipelineResult(id=1, result=result_dict)
        db.add(db_result)
    else:
        db_result.result = result_dict
    db.commit()

    return result_dict


# ─── New Phase 2 Endpoints ───────────────────────────────────────────────────



@router.get("/state/history")
def get_state_history(limit: int = Query(default=10, ge=1, le=50)):
    """GET /api/state/history — Returns previous PipelineState versions."""
    all_states = history_manager.get_all()
    # Return most recent `limit` entries
    return {
        "count": len(all_states),
        "limit": limit,
        "history": all_states[-limit:],
    }


@router.get("/state/diff")
def get_state_diff():
    """GET /api/state/diff — Returns a diff between the two most recent states."""
    all_states = history_manager.get_all()
    if len(all_states) < 2:
        return {"message": "Not enough history to generate diff.", "diff": {}}
    # diff expects PipelineState objects; pass the raw dicts and compute field-level diff
    from app.pipeline.serializer import _deep_diff
    changes = _deep_diff(all_states[-2], all_states[-1], "")
    return {
        "from_version": all_states[-2].get("metadata", {}).get("version"),
        "to_version": all_states[-1].get("metadata", {}).get("version"),
        "changes": changes,
    }


@router.post("/state/reset")
def reset_state(db: Session = Depends(get_db)):
    """POST /api/state/reset — Clear history, invalidate cache, re-run pipeline."""
    history_manager.clear()
    controller.invalidate()
    metrics.reset()

    # Clear the DB cached pipeline result
    from app.models import PipelineResult
    db_result = db.query(PipelineResult).filter(PipelineResult.id == 1).first()
    if db_result:
        db.delete(db_result)
        db.commit()

    new_state = _run_pipeline(db, trigger="SYSTEM")
    return {"success": True, "message": "Pipeline state reset.", "state": new_state}


# ─── Observability ───────────────────────────────────────────────────────────

@router.get("/pipeline/metrics")
def get_pipeline_metrics():
    """GET /api/pipeline/metrics — Returns pipeline observability metrics."""
    return metrics.snapshot()


# ─── Legacy Endpoints (backward-compatible) ──────────────────────────────────

@router.get("/pipeline/state")
def get_pipeline_state(db: Session = Depends(get_db)):
    """
    GET /api/pipeline/state (legacy) — delegates to the new /api/state endpoint.
    """
    return _run_pipeline(db, trigger="SYSTEM")


@router.post("/pipeline/run")
def run_pipeline(db: Session = Depends(get_db)):
    """
    POST /api/pipeline/run (legacy) — triggers the pipeline controller and returns state.
    """
    from app.routers.audit import create_audit_entry
    create_audit_entry(db, "Operator", "Master intelligence pipeline execution completed",
                       "Pipeline Engine", "USER")
    return _run_pipeline(db, trigger="USER")
