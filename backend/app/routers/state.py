"""
GET /api/state — backward-compatible endpoint that now delegates to the Pipeline Controller.

Returns a StateResponse schema identical to what the frontend expects.
All computation is now centralized in the Pipeline Controller (Phase 2).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import StateResponse

router = APIRouter()


@router.get("/state", response_model=StateResponse)
def get_state(db: Session = Depends(get_db)):
    """
    Returns the current KPI, incident feed, and risk signals.
    Delegates computation to the Pipeline Controller (centralized intelligence pipeline).
    Maintains 100% backward compatibility with the legacy StateResponse schema.
    """
    # Import here to avoid circular imports at module load time
    from app.routers.pipeline import _run_pipeline, _build_context

    result = _run_pipeline(db, trigger="SYSTEM")

    # Map the unified pipeline result into the legacy StateResponse schema
    state_block = result.get("state", {})
    exec_sec = result.get("executive", {})
    kpi_raw = state_block.get("kpi") or exec_sec.get("kpi", {})

    return StateResponse(
        kpi=kpi_raw,
        incident_feed=state_block.get("incident_feed") or exec_sec.get("incident_feed", []),
        risk_signals=state_block.get("risk_signals") or exec_sec.get("risk_signals", []),
        active_scenario=result.get("active_scenario_id"),
        demo_step=result.get("demo_step", 0),
        brent_price=state_block.get("brent_price") or exec_sec.get("brent_price", 88.0),
        timestamp=result.get("generated_at", datetime.now(timezone.utc).isoformat()),
    )
