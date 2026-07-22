"""
POST /api/simulate — Run scenario simulation and return 30-day projection
Dynamically extracts parameters for any loaded scenario.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import SimulationRequest, SimulationResponse, SimulationDayPoint
from app.core.scenario_engine import get_scenario
from app.routers.audit import create_audit_entry

router = APIRouter()


@router.post("/simulate", response_model=SimulationResponse)
def run_simulation(request: SimulationRequest, db: Session = Depends(get_db)):
    scenario = get_scenario(request.scenario_id)

    if not scenario:
        # Baseline projection if scenario ID not found
        daily_points = [
            SimulationDayPoint(day=d, brent_price=88.0, risk_score=32, spr_level_pct=64.0, supply_gap_mbbl=0.0, action=None)
            for d in range(1, request.duration_days + 1)
        ]
        return SimulationResponse(
            scenario_id=request.scenario_id,
            duration_days=request.duration_days,
            summary={"status": "BASELINE", "note": "No disruption scenario.", "peak_brent": 88.0, "total_supply_gap_mbbl": 0.0, "severity": "LOW"},
            daily_projection=daily_points,
            recommended_action="No action required. Operations within normal parameters.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    # Robust extraction across different scenario schema versions
    baseline_brent = float(scenario.get("brent_baseline_usd", 88.0))
    
    # Calculate price shock
    price_spike = scenario.get("crude_price_spike_usd")
    if price_spike is None:
        b_shock = scenario.get("brent_shock_usd")
        if b_shock is not None:
            price_spike = b_shock - baseline_brent
        else:
            price_spike = scenario.get("parameters", {}).get("crude_price_spike_usd", 12.0)
    
    shock = float(price_spike) * request.severity_multiplier

    # Calculate supply gap (M bbl/day)
    raw_gap = (
        scenario.get("india_import_gap_mbbl_day") or
        scenario.get("parameters", {}).get("supply_shortfall_mbbl") or
        scenario.get("kpi", {}).get("supply_gap")
    )
    if isinstance(raw_gap, str):
        try:
            raw_gap = float(raw_gap.replace("M bbl/day", "").replace("M", "").strip())
        except ValueError:
            raw_gap = 1.8
    base_gap = float(raw_gap if raw_gap is not None else 1.8) * float(request.severity_multiplier)

    # Risk score & SPR coverage
    kpi_dict = scenario.get("kpi", {})
    raw_risk = float(kpi_dict.get("risk_score") or scenario.get("geopolitical_risk") or scenario.get("parameters", {}).get("geopolitical_risk", 60))
    base_risk = min(100.0, raw_risk * float(request.severity_multiplier))
    spr_start = float(kpi_dict.get("spr_coverage") or scenario.get("parameters", {}).get("inventory_days", 45))

    daily_points = []
    spr_level = float(min(100.0, spr_start))
    drawdown_rate = (base_gap / max(1.0, spr_start)) * 15.0  # Daily depletion rate %

    for d in range(1, request.duration_days + 1):
        # Shock peaks at day 5, decays over 30 days
        if d <= 5:
            shock_factor = d / 5.0
        elif d <= 15:
            shock_factor = 1.0
        else:
            shock_factor = max(0.1, 1.0 - (d - 15) / (request.duration_days - 15) * 0.6)

        brent = round(baseline_brent + shock * shock_factor, 1)
        risk = int(min(100, max(20, base_risk * (0.5 + 0.5 * shock_factor))))
        gap = round(base_gap * shock_factor, 2)

        # SPR depletes during gap period
        if gap > 0 and d <= 22:
            spr_level = max(10.0, spr_level - drawdown_rate)
        elif d > 22:
            # Alternate cargo arrives — gap closes & SPR recovers
            spr_level = min(95.0, spr_level + 0.5)

        action = None
        if d == 1:
            action = f"Risk signal detected for {scenario.get('name', 'Scenario')} — Monitoring elevated"
        elif d == 3:
            action = f"SPR drawdown of {base_gap}M bbl/day authorized"
        elif d == 5:
            action = f"Alternate procurement orders placed ({scenario.get('safe_suppliers', ['West Africa'])[0]} route)"
        elif d == 22:
            action = "Alternate cargo vessels arriving — Supply gap closing"
        elif d == 25:
            action = "Supply chain stabilizing — Strategic reserve replenishment active"

        daily_points.append(SimulationDayPoint(
            day=d,
            brent_price=brent,
            risk_score=risk,
            spr_level_pct=round(spr_level, 1),
            supply_gap_mbbl=gap,
            action=action,
        ))

    summary = {
        "peak_brent": max(p.brent_price for p in daily_points),
        "peak_risk": max(p.risk_score for p in daily_points),
        "min_spr_pct": round(min(p.spr_level_pct for p in daily_points), 1),
        "total_supply_gap_mbbl": round(sum(p.supply_gap_mbbl for p in daily_points), 1),
        "scenario": scenario["name"],
        "severity": scenario.get("severity", "HIGH"),
        "base_gap_daily": base_gap,
        "price_spike_usd": shock,
    }

    create_audit_entry(
        db=db,
        user="AI Agent",
        action=f"Simulation Run: {scenario['name']} ({request.duration_days} days)",
        module="Scenario Simulator",
        event_type="AI",
        details={"scenario_id": request.scenario_id, "duration": request.duration_days, "summary": summary},
    )

    alt_suppliers = ", ".join(scenario.get("safe_suppliers", ["West Africa", "Brazil", "USA"])[:2])
    rec_action = (
        f"Activate strategic reserve drawdown ({base_gap}M bbl/day) and reroute crude procurement to {alt_suppliers} "
        f"within 48 hours to mitigate projected ${shock:.1f}/bbl price shock."
    )

    return SimulationResponse(
        scenario_id=request.scenario_id,
        duration_days=request.duration_days,
        summary=summary,
        daily_projection=daily_points,
        recommended_action=rec_action,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
