"""
POST /api/procurement/optimize — Optimize supplier procurement mix
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import ProcurementRequest, ProcurementResponse
from app.core.procurement_engine import optimize_procurement
from app.routers.audit import create_audit_entry

router = APIRouter()


@router.post("/procurement/optimize", response_model=ProcurementResponse)
def optimize(request: ProcurementRequest, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None

    result = optimize_procurement(
        scenario_id=scenario_id,
        target_volume=request.target_volume_mbbl,
        duration_days=request.duration_days,
        exclude_routes=request.exclude_routes,
        max_risk_score=request.max_risk_score,
    )

    create_audit_entry(
        db=db,
        user="AI Agent",
        action="Procurement Optimization Run",
        module="Procurement Optimizer",
        event_type="AI",
        details={
            "scenario_id": scenario_id,
            "target_volume": request.target_volume_mbbl,
            "top_supplier": result["recommended_mix"][0]["name"] if result["recommended_mix"] else "N/A",
        },
    )

    return ProcurementResponse(
        recommended_mix=result["recommended_mix"],
        total_cost_estimate_cr=result["total_cost_estimate_cr"],
        coverage_days=result["coverage_days"],
        risk_summary=result["risk_summary"],
        optimized_for=result["optimized_for"],
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
