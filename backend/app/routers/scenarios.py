"""
GET /api/scenarios — List all available scenarios
POST /api/scenarios/{scenario_id}/activate — Activate a scenario
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState, AuditLog
from app.schemas import (
    ScenarioSummary,
    ScenarioActivateResponse,
    ScenarioCompareRequest,
    ScenarioCompareResponse,
    ScenarioCompareItem,
)
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


@router.post("/scenarios/compare", response_model=ScenarioCompareResponse)
def compare_scenarios(req: ScenarioCompareRequest, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    active_id = state.active_scenario_id if state else None

    all_scenarios = get_all_scenarios()
    target_ids = req.scenario_ids
    if not target_ids:
        target_ids = [s.get("id") for s in all_scenarios if s.get("id")]

    scenarios_data = []
    daily_projections_map = {}

    mult = float(req.severity_multiplier or 1.0)
    dur = int(req.duration_days or 30)

    for s_id in target_ids:
        scen = get_scenario(s_id)
        if not scen:
            continue

        name = scen.get("name", s_id)
        sev = scen.get("severity", "HIGH")
        prob = int(scen.get("probability", 50))
        reg = scen.get("region", "Middle East")
        risk = float(scen.get("geopolitical_risk") or scen.get("kpi", {}).get("risk_score") or 50)

        baseline_brent = float(scen.get("brent_baseline_usd", 88.0))
        price_spike = scen.get("crude_price_spike_usd")
        if price_spike is None:
            b_shock = scen.get("brent_shock_usd")
            price_spike = (b_shock - baseline_brent) if b_shock else 12.0

        price_spike = float(price_spike) * mult
        brent_shock = round(baseline_brent + price_spike, 2)

        raw_gap = (
            scen.get("india_import_gap_mbbl_day") or
            scen.get("parameters", {}).get("supply_shortfall_mbbl") or 1.8
        )
        if isinstance(raw_gap, str):
            try:
                raw_gap = float(raw_gap.replace("M bbl/day", "").replace("M", "").strip())
            except ValueError:
                raw_gap = 1.8
        import_gap = float(raw_gap) * mult
        total_loss = round(import_gap * dur * 0.7, 1)

        econ = scen.get("economic", {})
        gdp_drag = round(float(econ.get("gdp_impact_pct", -0.30)) * mult, 2)
        inflation = round(float(econ.get("inflation_pct", 1.20)) * mult, 2)
        affected_routes = scen.get("affected_routes", ["Strait of Hormuz"])
        safe_suppliers = scen.get("safe_suppliers", ["West Africa", "Brazil"])

        rec_action = (
            f"Authorize SPR drawdown of {import_gap:.1f}M bbl/d and shift procurement to {', '.join(safe_suppliers[:2])}."
        )

        scenarios_data.append(ScenarioCompareItem(
            id=s_id,
            name=name,
            severity=sev,
            probability=prob,
            region=reg,
            geopolitical_risk=risk,
            import_gap_mbbl_day=round(import_gap, 2),
            total_supply_loss_mbbl=total_loss,
            brent_baseline_usd=baseline_brent,
            brent_shock_usd=brent_shock,
            crude_price_spike_usd=round(price_spike, 2),
            gdp_impact_pct=gdp_drag,
            inflation_pct=inflation,
            affected_routes=affected_routes,
            safe_suppliers=safe_suppliers,
            is_active=(s_id == active_id),
            recommended_action=rec_action,
        ))

        # Daily trajectory generation for overlay chart
        daily_points = []
        spr_level = 100.0
        drawdown_rate = (import_gap / 45.0) * 15.0
        for d in range(1, dur + 1):
            if d <= 5:
                shock_factor = d / 5.0
            elif d <= 15:
                shock_factor = 1.0
            else:
                shock_factor = max(0.1, 1.0 - (d - 15) / max(1, dur - 15) * 0.6)

            brent_val = round(baseline_brent + price_spike * shock_factor, 1)
            gap_val = round(import_gap * shock_factor, 2)
            if gap_val > 0 and d <= 22:
                spr_level = max(10.0, spr_level - drawdown_rate)
            elif d > 22:
                spr_level = min(95.0, spr_level + 0.5)

            daily_points.append({
                "day": d,
                "brent_price": brent_val,
                "spr_level_pct": round(spr_level, 1),
                "supply_gap_mbbl": gap_val
            })
        daily_projections_map[s_id] = daily_points

    # Combine into unified overlay_chart dataset
    overlay_chart = []
    for d in range(1, dur + 1):
        point = {"day": d, "t": f"Day {d}"}
        for s_id, pts in daily_projections_map.items():
            dp = next((p for p in pts if p["day"] == d), None)
            if dp:
                point[f"{s_id}_price"] = dp["brent_price"]
                point[f"{s_id}_spr"] = dp["spr_level_pct"]
                point[f"{s_id}_gap"] = dp["supply_gap_mbbl"]
        overlay_chart.append(point)

    # Comparative AI Summary
    if scenarios_data:
        worst_case = max(scenarios_data, key=lambda s: s.crude_price_spike_usd)
        summary_text = (
            f"Comparison of {len(scenarios_data)} risk scenarios across a {dur}-day window "
            f"({mult}x shock factor). Worst-case vulnerability identified in '{worst_case.name}' "
            f"with peak Brent shock of ${worst_case.brent_shock_usd:.1f}/bbl and daily import gap of "
            f"{worst_case.import_gap_mbbl_day:.1f}M bbl/day. Operational recommendation: deploy "
            f"coordinated SPR releases and pre-allocate alternate shipping routes for Cape of Good Hope."
        )
    else:
        summary_text = "No scenario data available for comparison."

    return ScenarioCompareResponse(
        scenarios=scenarios_data,
        overlay_chart=overlay_chart,
        comparative_summary=summary_text,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


