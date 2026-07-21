"""
POST /api/decisions — Record a decision made by an operator
GET /api/decisions — List all decisions
GET /api/decision-board/current — Get current motion based on active scenario
"""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Dict, Any

from app.database import get_db
from app.models import Decision, ScenarioState
from app.schemas import DecisionRequest, DecisionResponse
from app.routers.audit import create_audit_entry

router = APIRouter()


SCENARIO_MOTIONS = {
    "hormuz_closure": {
        "id": "MOT-HORMUZ",
        "title": "Authorize 8.5 MMT SPR Drawdown and West Africa Route Diversion",
        "proposedBy": "UrjaNetra AI Engine",
        "status": "VOTING",
        "urgency": "CRITICAL",
        "votes": {"for": 4, "against": 1, "abstain": 1},
        "quorum": 6,
        "deadline": "4 hours",
        "summary": (
            "Activate emergency drawdown of 8.5 MMT from Visakhapatnam and Mangaluru SPR facilities "
            "and reroute 4 VLCC tankers via Cape of Good Hope to stabilize domestic crude supply "
            "amid Strait of Hormuz disruption (18% delay risk)."
        ),
        "aiRecommendation": "APPROVE",
        "aiConfidence": 83,
        "members": [
            {"name": "Arjun Mehta", "role": "Commander, NEMC", "vote": "PENDING", "avatar": "AM"},
            {"name": "Priya Sharma", "role": "MoP Secretary", "vote": "FOR", "avatar": "PS"},
            {"name": "Rajiv Kumar", "role": "IOC Chairman", "vote": "FOR", "avatar": "RK"},
            {"name": "Anita Bose", "role": "Finance Ministry", "vote": "AGAINST", "avatar": "AB"},
            {"name": "Suresh Nair", "role": "HPCL Director", "vote": "FOR", "avatar": "SN"},
            {"name": "Vikram Singh", "role": "MEA Representative", "vote": "ABSTAIN", "avatar": "VS"},
        ]
    },
    "opec_cut": {
        "id": "MOT-OPEC",
        "title": "Authorize USA & Brazil Procurement Mix and Extended Drawdown Plan",
        "proposedBy": "Procurement AI",
        "status": "VOTING",
        "urgency": "HIGH",
        "votes": {"for": 3, "against": 1, "abstain": 2},
        "quorum": 6,
        "deadline": "12 hours",
        "summary": (
            "Pivot spot and term contract allocations to Brazil and USA suppliers to offset OPEC+ "
            "2.0M bbl/day production cut. Authorize extended 60-day SPR drawdown scheduling."
        ),
        "aiRecommendation": "APPROVE",
        "aiConfidence": 82,
        "members": [
            {"name": "Arjun Mehta", "role": "Commander, NEMC", "vote": "PENDING", "avatar": "AM"},
            {"name": "Priya Sharma", "role": "MoP Secretary", "vote": "FOR", "avatar": "PS"},
            {"name": "Rajiv Kumar", "role": "IOC Chairman", "vote": "FOR", "avatar": "RK"},
            {"name": "Anita Bose", "role": "Finance Ministry", "vote": "AGAINST", "avatar": "AB"},
            {"name": "Suresh Nair", "role": "HPCL Director", "vote": "ABSTAIN", "avatar": "SN"},
            {"name": "Vikram Singh", "role": "MEA Representative", "vote": "ABSTAIN", "avatar": "VS"},
        ]
    },
    "russia_sanctions": {
        "id": "MOT-RUSSIA",
        "title": "Authorize 45-day Russian Crude Phase-Out and West Africa Transition Plan",
        "proposedBy": "Compliance AI",
        "status": "VOTING",
        "urgency": "CRITICAL",
        "votes": {"for": 5, "against": 0, "abstain": 1},
        "quorum": 6,
        "deadline": "8 hours",
        "summary": (
            "Approve immediate suspension of Russian Urals crude purchase tenders and authorize "
            "a 45-day transition mix with West African crudes to comply with new OFAC sanctions."
        ),
        "aiRecommendation": "APPROVE",
        "aiConfidence": 75,
        "members": [
            {"name": "Arjun Mehta", "role": "Commander, NEMC", "vote": "PENDING", "avatar": "AM"},
            {"name": "Priya Sharma", "role": "MoP Secretary", "vote": "FOR", "avatar": "PS"},
            {"name": "Rajiv Kumar", "role": "IOC Chairman", "vote": "FOR", "avatar": "RK"},
            {"name": "Anita Bose", "role": "Finance Ministry", "vote": "FOR", "avatar": "AB"},
            {"name": "Suresh Nair", "role": "HPCL Director", "vote": "FOR", "avatar": "SN"},
            {"name": "Vikram Singh", "role": "MEA Representative", "vote": "ABSTAIN", "avatar": "VS"},
        ]
    },
    "port_disruption": {
        "id": "MOT-PORT",
        "title": "Authorize Emergency SPR Padur Drawdown and East Coast Port Rerouting",
        "proposedBy": "Operations AI",
        "status": "VOTING",
        "urgency": "CRITICAL",
        "votes": {"for": 4, "against": 0, "abstain": 2},
        "quorum": 6,
        "deadline": "2 hours",
        "summary": (
            "Approve immediate activation of SPR Padur drawdown to supply refineries in western India, "
            "and reroute inbound VLCCs to east coast terminals (Vizag, Ennore) due to Gujarat ports storm closure."
        ),
        "aiRecommendation": "APPROVE",
        "aiConfidence": 85,
        "members": [
            {"name": "Arjun Mehta", "role": "Commander, NEMC", "vote": "PENDING", "avatar": "AM"},
            {"name": "Priya Sharma", "role": "MoP Secretary", "vote": "FOR", "avatar": "PS"},
            {"name": "Rajiv Kumar", "role": "IOC Chairman", "vote": "FOR", "avatar": "RK"},
            {"name": "Anita Bose", "role": "Finance Ministry", "vote": "ABSTAIN", "avatar": "AB"},
            {"name": "Suresh Nair", "role": "HPCL Director", "vote": "FOR", "avatar": "SN"},
            {"name": "Vikram Singh", "role": "MEA Representative", "vote": "ABSTAIN", "avatar": "VS"},
        ]
    }
}

DEFAULT_MOTION = {
    "id": "MOT-MONITOR",
    "title": "System Monitoring and Standard Operations Protocol",
    "proposedBy": "System Admin",
    "status": "APPROVED",
    "urgency": "LOW",
    "votes": {"for": 6, "against": 0, "abstain": 0},
    "quorum": 6,
    "deadline": "Passed",
    "summary": "No active threat scenarios. Continue monitoring crude price indices, pipeline health, and reserve levels.",
    "aiRecommendation": "MONITOR",
    "aiConfidence": 99,
    "members": []
}


@router.post("/decisions", response_model=DecisionResponse)
def record_decision(request: DecisionRequest, db: Session = Depends(get_db)):
    decision_id = f"DEC-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"

    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = request.scenario_id or (state.active_scenario_id if state else "unknown")

    decision = Decision(
        decision_id=decision_id,
        scenario_id=scenario_id,
        action_type=request.action_type,
        approved_by=request.approved_by,
        details=request.details,
        status="APPROVED",
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    create_audit_entry(
        db=db,
        user=request.approved_by,
        action=f"Decision Approved: {request.action_type}",
        module="Executive Decision Board",
        event_type="USER",
        details={"decision_id": decision_id, "action_type": request.action_type},
    )

    return DecisionResponse(
        decision_id=decision_id,
        action_type=request.action_type,
        approved_by=request.approved_by,
        scenario_id=scenario_id,
        status="APPROVED",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/decisions")
def get_decisions(db: Session = Depends(get_db)):
    decisions = db.query(Decision).order_by(Decision.id.desc()).all()
    return decisions


@router.get("/decision-board/current")
def get_current_motion(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None

    # Deep copy the dict
    import copy
    motion = copy.deepcopy(SCENARIO_MOTIONS.get(scenario_id, DEFAULT_MOTION))

    # Check if a user decision has been made in the database for this scenario
    if scenario_id:
        decision = db.query(Decision).filter(
            Decision.scenario_id == scenario_id
        ).order_by(Decision.id.desc()).first()

        if decision:
            action = decision.action_type
            if "APPROVE" in action:
                motion["status"] = "APPROVED"
                for m in motion.get("members", []):
                    if m["name"] == "Arjun Mehta":
                        m["vote"] = "FOR"
            elif "REJECT" in action:
                motion["status"] = "REJECTED"
                for m in motion.get("members", []):
                    if m["name"] == "Arjun Mehta":
                        m["vote"] = "AGAINST"
            elif "SIMULATE" in action:
                motion["status"] = "SIMULATION_REQUESTED"
                for m in motion.get("members", []):
                    if m["name"] == "Arjun Mehta":
                        m["vote"] = "ABSTAIN"

    return motion
