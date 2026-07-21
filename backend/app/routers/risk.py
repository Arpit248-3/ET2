"""
GET /api/risk — Full risk assessment for active scenario
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import RiskResponse
from app.core.risk_engine import calculate_risk

router = APIRouter()


@router.get("/risk", response_model=RiskResponse)
def get_risk(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None
    demo_step = state.demo_step if state else 0

    data = calculate_risk(scenario_id, demo_step)

    return RiskResponse(
        overall_score=data["overall_score"],
        crisis_level=data["crisis_level"],
        components=data["components"],
        trend=data["trend"],
        signals=data["signals"],
        recommendation=data["recommendation"],
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
