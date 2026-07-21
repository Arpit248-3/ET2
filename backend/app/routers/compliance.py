"""
POST /api/compliance/check — Run compliance check for suppliers
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import ComplianceCheckRequest, ComplianceResponse
from app.core.compliance_engine import check_compliance
from app.routers.audit import create_audit_entry

router = APIRouter()


@router.post("/compliance/check", response_model=ComplianceResponse)
def run_compliance_check(request: ComplianceCheckRequest, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None

    result = check_compliance(
        supplier_ids=request.supplier_ids,
        route=request.route,
        scenario_id=scenario_id,
    )

    create_audit_entry(
        db=db,
        user="Compliance Engine",
        action=f"Compliance Check — {len(request.supplier_ids)} supplier(s) — {'ALL CLEAR' if result['all_clear'] else str(result['flagged_count']) + ' FLAGGED'}",
        module="Compliance Shield",
        event_type="AI",
        details={"supplier_count": len(request.supplier_ids), "flagged": result["flagged_count"]},
    )

    return ComplianceResponse(
        results=result["results"],
        all_clear=result["all_clear"],
        flagged_count=result["flagged_count"],
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
