"""
GET /api/scenarios — List all available scenarios
POST /api/scenarios/{scenario_id}/activate — Activate a scenario
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState, AuditLog
from app.schemas import ScenarioSummary, ScenarioActivateResponse
from app.core.scenario_engine import get_all_scenarios, get_scenario
from app.routers.audit import create_audit_entry

router = APIRouter()


@router.get("/scenarios", response_model=list[ScenarioSummary])
def list_scenarios(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    active_id = state.active_scenario_id if state else None

    scenarios = get_all_scenarios()
    return [
        ScenarioSummary(
            id=s.get("id", ""),
            name=s.get("name", "Unnamed Scenario"),
            description=s.get("description", ""),
            severity=s.get("severity", "HIGH"),
            probability=int(s.get("probability", 50)),
            region=s.get("region", "Global"),
            is_active=(s.get("id") == active_id),
        )
        for s in scenarios
    ]


@router.post("/scenarios/{scenario_id}/activate", response_model=ScenarioActivateResponse)
def activate_scenario(scenario_id: str, db: Session = Depends(get_db)):
    scenario = get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")

    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1)
        db.add(state)

    state.active_scenario_id = scenario_id
    state.demo_step = 0
    state.activated_at = datetime.now(timezone.utc)
    db.commit()

    create_audit_entry(
        db=db,
        user="Operator",
        action=f"Scenario Activated: {scenario['name']}",
        module="Scenario Simulator",
        event_type="USER",
        details={"scenario_id": scenario_id, "severity": scenario.get("severity", "MEDIUM")},
    )

    return ScenarioActivateResponse(
        success=True,
        scenario_id=scenario_id,
        message=f"Scenario '{scenario['name']}' activated. Demo reset to step 0.",
        activated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/scenarios/upload")
def upload_scenario(payload: dict, db: Session = Depends(get_db)):
    # Validate required fields
    required = [
        "scenario_name", "crude_price_change_pct", "shipping_delay_days",
        "insurance_spike_pct", "supplier_disruption_pct", "spr_coverage_days",
        "route_risk", "affected_routes", "affected_suppliers"
    ]
    for field in required:
        if field not in payload:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

    # Process inputs
    name = payload["scenario_name"]
    scenario_id = "".join([c if c.isalnum() else "_" for c in name.lower()]).strip("_")
    while "__" in scenario_id:
        scenario_id = scenario_id.replace("__", "_")

    # Map fields
    route_risk = (payload.get("route_risk") or "critical").upper()
    severity = "CRITICAL" if route_risk == "CRITICAL" else "HIGH" if route_risk == "HIGH" else "MEDIUM"

    price_change = float(payload["crude_price_change_pct"])
    brent_baseline = 88.0
    brent_shock = round(brent_baseline * (1 + price_change / 100), 2)

    affected_routes = payload["affected_routes"]
    affected_suppliers = payload["affected_suppliers"]

    # Timeline
    timeline = payload.get("timeline")
    if not timeline:
        timeline = [
            { "time": "09:00", "event": f"Baseline operations — Brent $88/bbl", "type": "INFO", "risk": 32, "step": 0 },
            { "time": "09:15", "event": f"Risk detected in {', '.join(affected_routes)}", "type": "WARNING", "risk": 45, "step": 1 },
            { "time": "09:30", "event": f"Tension escalates. Route risk assessed as {route_risk.lower()}", "type": "WARNING", "risk": 62, "step": 2 },
            { "time": "10:00", "event": f"Price shock hits — Brent reaches ${brent_shock}/bbl", "type": "CRITICAL", "risk": 74, "step": 3 },
            { "time": "10:15", "event": f"AI runs simulation — import gap: 2.4M bbl/day detected", "type": "AI", "risk": 83, "step": 4 },
            { "time": "10:30", "event": "Procurement optimizer calculates safe supplier mix", "type": "AI", "risk": 82, "step": 5 },
            { "time": "10:45", "event": f"SPR bridge planned — drawdown authorization initiated", "type": "ACTION", "risk": 76, "step": 6 },
            { "time": "11:00", "event": "Compliance checks completed for alternate shipping routes", "type": "ACTION", "risk": 69, "step": 7 },
            { "time": "11:15", "event": "Red Team issues critique on cargo delay assumptions", "type": "AI", "risk": 65, "step": 8 },
            { "time": "11:30", "event": "Executive Brief generated for national energy council", "type": "ACTION", "risk": 61, "step": 9 },
            { "time": "11:45", "event": "Crisis response plan approved by Commander Arjun Mehta", "type": "ACTION", "risk": 58, "step": 10 }
        ]
    else:
        # ensure step index
        for idx, ev in enumerate(timeline):
            if "step" not in ev:
                ev["step"] = idx

    scenario_data = {
        "id": scenario_id,
        "name": name,
        "description": f"Custom scenario: {name} with price change: {price_change}% and shipping delay: {payload['shipping_delay_days']} days.",
        "severity": severity,
        "probability": 50,
        "region": "Custom Region",
        "activated_at": None,
        "duration_days": 30,
        "geopolitical_risk": 80,
        "maritime_delay_pct": int(payload["shipping_delay_days"]),
        "crude_price_spike_usd": round(brent_shock - brent_baseline, 2),
        "insurance_premium_spike_pct": int(payload["insurance_spike_pct"]),
        "affected_routes": affected_routes,
        "safe_routes": [r for r in ["Cape of Good Hope", "Atlantic", "Pacific"] if r not in affected_routes],
        "affected_suppliers": affected_suppliers,
        "safe_suppliers": [s for s in ["West Africa", "Brazil", "USA"] if s not in affected_suppliers],
        "brent_baseline_usd": brent_baseline,
        "brent_shock_usd": brent_shock,
        "india_import_gap_mbbl_day": 2.4,
        "economic": {
            "inflation_pct": round(price_change * 0.1, 2),
            "gdp_impact_pct": round(-price_change * 0.02, 2),
            "fuel_price_rise_inr": round(price_change * 0.7, 2),
            "fiscal_cost_cr": int(price_change * 1500),
            "current_account_deficit_pct_gdp": round(-price_change * 0.07, 2),
            "trade_deficit_cr": int(price_change * 1000)
        },
        "risk_weights": {
            "geopolitical_risk": 0.25,
            "maritime_delay": 0.20,
            "crude_price_spike": 0.15,
            "insurance_premium": 0.10,
            "supplier_reliability": 0.15,
            "sanctions_exposure": 0.10,
            "spr_coverage": 0.05
        },
        "timeline": timeline,
        "kpi": {
            "risk_score": 80,
            "crisis_level": severity,
            "active_incidents": len(affected_routes) + len(affected_suppliers),
            "supply_gap": "2.4M bbl/day",
            "spr_coverage": int(payload["spr_coverage_days"]),
            "active_sanctions": 6
        }
    }

    # Save to disk
    import os
    import json
    from app.core.scenario_engine import SCENARIOS_DIR, reload_scenarios

    file_path = os.path.join(SCENARIOS_DIR, f"{scenario_id}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(scenario_data, f, indent=2)

    # Reload scenarios in scenario engine
    reload_scenarios()

    # Activate scenario
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1)
        db.add(state)

    state.active_scenario_id = scenario_id
    state.demo_step = 0
    state.activated_at = datetime.now(timezone.utc)
    db.commit()

    create_audit_entry(
        db=db,
        user="Operator",
        action=f"Custom Scenario Uploaded and Activated: {name}",
        module="Scenario Simulator",
        event_type="USER",
        details={"scenario_id": scenario_id, "severity": severity},
    )

    return {
        "success": True,
        "scenario_id": scenario_id,
        "message": f"Custom scenario '{name}' uploaded and activated. Demo reset to step 0.",
        "activated_at": datetime.now(timezone.utc).isoformat()
    }

