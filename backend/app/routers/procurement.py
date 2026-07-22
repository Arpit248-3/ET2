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

from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import uuid4

class RouteApprovalRequest(BaseModel):
    route_id: str
    route_name: str
    supplier: str
    destination_port: Optional[str] = "Jamnagar / Vadinar Terminal"
    eta_days: Optional[int] = 22
    landed_cost: Optional[str] = "$84.2/bbl"
    risk_score: Optional[int] = 18
    approved_by: Optional[str] = "Commander Arjun Mehta, NEMC"
    details: Optional[Dict[str, Any]] = None

# Global memory store for active approved route
ACTIVE_APPROVED_ROUTE: Dict[str, Any] = {
    "route_id": "cape_of_good_hope",
    "route_name": "Cape of Good Hope (West Africa / Atlantic Corridor)",
    "supplier": "West Africa (Nigeria / Bonny Light)",
    "destination_port": "Jamnagar / Vadinar Terminal",
    "eta_days": 22,
    "landed_cost": "$84.2/bbl",
    "risk_score": 18,
    "status": "APPROVED",
    "approved_by": "Commander Arjun Mehta, NEMC",
    "timestamp": datetime.now(timezone.utc).isoformat()
}


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


@router.post("/procurement/approve-route")
def approve_route(request: RouteApprovalRequest, db: Session = Depends(get_db)):
    global ACTIVE_APPROVED_ROUTE
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else "hormuz_closure"

    now_iso = datetime.now(timezone.utc).isoformat()
    approved_data = {
        "route_id": request.route_id,
        "route_name": request.route_name,
        "supplier": request.supplier,
        "destination_port": request.destination_port or "Jamnagar / Vadinar Terminal",
        "eta_days": request.eta_days or 22,
        "landed_cost": request.landed_cost or "$84.2/bbl",
        "risk_score": request.risk_score or 18,
        "status": "APPROVED",
        "approved_by": request.approved_by or "Commander Arjun Mehta, NEMC",
        "timestamp": now_iso
    }
    ACTIVE_APPROVED_ROUTE = approved_data

    # Record decision entry in DB
    from app.models import Decision
    try:
        dec = Decision(
            decision_id=f"DEC-ROUTE-{uuid4().hex[:6].upper()}",
            scenario_id=scenario_id or "hormuz_closure",
            action_type="APPROVE_ALTERNATIVE_ROUTE",
            approved_by=request.approved_by or "Commander Arjun Mehta, NEMC",
            details=approved_data,
            status="APPROVED"
        )
        db.add(dec)

        create_audit_entry(
            db=db,
            user=request.approved_by or "Commander Arjun Mehta",
            action=f"Approved Alternative Shipping Route: {request.route_name}",
            module="Procurement Optimizer / Route Command",
            event_type="USER",
            details=approved_data,
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        print("Database save warning:", exc)

    # Broadcast via Event Bus SSE
    try:
        from app.pipeline.event_bus import event_bus
        event_bus.publish({
            "event": "ROUTE_APPROVED",
            "data": approved_data,
            "timestamp": now_iso
        })
    except Exception as e:
        print(f"SSE publish error: {e}")

    return {
        "status": "APPROVED",
        "message": f"Route '{request.route_name}' has been approved and activated across the network.",
        "approved_route": approved_data
    }


@router.get("/procurement/approved-route")
def get_approved_route():
    return ACTIVE_APPROVED_ROUTE
