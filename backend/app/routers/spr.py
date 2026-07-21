"""
POST /api/spr/plan — Generate SPR drawdown plan
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import SPRPlanRequest, SPRPlanResponse
from app.core.spr_engine import plan_spr
from app.core.scenario_engine import get_scenario
from app.routers.audit import create_audit_entry

router = APIRouter()


@router.post("/spr/plan", response_model=SPRPlanResponse)
def create_spr_plan(request: SPRPlanRequest, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None

    # If scenario is active, use its gap data as defaults if request uses defaults
    if scenario_id:
        scenario = get_scenario(scenario_id)
        if scenario and request.daily_gap_mbbl == 2.4:
            request.daily_gap_mbbl = scenario.get("india_import_gap_mbbl_day", 2.4)

    result = plan_spr(
        daily_gap_mbbl=request.daily_gap_mbbl,
        days_until_cargo=request.days_until_cargo,
        target_coverage_days=request.target_coverage_days,
    )

    create_audit_entry(
        db=db,
        user="AI Agent",
        action=f"SPR Plan Generated — {result['total_drawdown_required_mbbl']}M bbl drawdown",
        module="SPR Planner",
        event_type="AI",
        details={
            "drawdown_mbbl": result["total_drawdown_required_mbbl"],
            "coverage_days": result["coverage_days"],
            "feasible": result["feasible"],
        },
    )

    return SPRPlanResponse(
        daily_supply_gap_mbbl=result["daily_supply_gap_mbbl"],
        days_until_cargo_arrival=result["days_until_cargo_arrival"],
        total_drawdown_required_mbbl=result["total_drawdown_required_mbbl"],
        reserve_after_action_mbbl=result["reserve_after_action_mbbl"],
        reserve_after_action_pct=result["reserve_after_action_pct"],
        coverage_days=result["coverage_days"],
        sites=result["sites"],
        feasible=result["feasible"],
        warning=result["warning"],
        depletion_projection=result.get("depletion_projection"),
        action_comparison=result.get("action_comparison"),
        ai_recommendation=result.get("ai_recommendation"),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
