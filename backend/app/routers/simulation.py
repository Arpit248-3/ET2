"""
POST /api/simulate — Run scenario simulation and return dynamic n-day projection
Dynamically extracts parameters and builds smooth, non-linear market trajectories for any loaded scenario.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import math

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
    
    mult = float(max(0.1, request.severity_multiplier))
    shock = float(price_spike) * mult

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
    base_gap = float(raw_gap if raw_gap is not None else 1.8) * mult

    # Risk score & SPR coverage
    kpi_dict = scenario.get("kpi", {})
    raw_risk = float(kpi_dict.get("risk_score") or scenario.get("geopolitical_risk") or scenario.get("parameters", {}).get("geopolitical_risk", 60))
    base_risk = min(100.0, raw_risk * mult)
    spr_start = float(kpi_dict.get("spr_coverage") or scenario.get("parameters", {}).get("inventory_days", 45))

    daily_points = []
    spr_level = float(min(100.0, spr_start))
    total_days = max(10, request.duration_days)

    for d in range(1, total_days + 1):
        # Build smooth, non-linear dynamic shock curve per scenario profile
        norm_t = d / float(total_days)

        if request.scenario_id == "hormuz_closure":
            # Fast explosive surge peaking at day 6, high plateau, gradual decay
            if d <= 6:
                shock_factor = math.sin((d / 6.0) * (math.pi / 2.0))
            elif d <= 18:
                shock_factor = 0.96 + 0.04 * math.sin(d * 1.3)
            else:
                decay_t = (d - 18) / float(total_days - 18)
                shock_factor = max(0.15, 1.0 - math.pow(decay_t, 1.3) * 0.85)
        elif request.scenario_id == "bab_el_mandeb_blockade":
            # Multi-stage routing delay escalation peaking around day 10
            if d <= 10:
                shock_factor = 0.5 * (1.0 - math.cos((d / 10.0) * math.pi))
            else:
                decay_t = (d - 10) / float(total_days - 10)
                shock_factor = max(0.20, 1.0 - 0.80 * math.sin(decay_t * (math.pi / 2.0)))
        elif request.scenario_id == "cyberattack_pipeline_scada":
            # Immediate sharp spike on day 3, technical resolution by day 14
            if d <= 3:
                shock_factor = (d / 3.0) ** 2
            elif d <= 14:
                shock_factor = max(0.1, 1.0 - ((d - 3) / 11.0) * 0.85)
            else:
                shock_factor = max(0.05, 0.15 - ((d - 14) / float(total_days - 14)) * 0.1)
        else:
            # General smooth bell shock curve
            peak_day = max(4, int(total_days * 0.25))
            if d <= peak_day:
                shock_factor = math.sin((d / float(peak_day)) * (math.pi / 2.0))
            else:
                decay_t = (d - peak_day) / float(total_days - peak_day)
                shock_factor = max(0.1, math.cos((decay_t * math.pi) / 2.0))

        # Add natural market micro-fluctuations (0.02 * sin) to prevent rigid straight lines
        noise = 0.02 * math.sin(d * 1.7) + 0.015 * math.cos(d * 2.3)
        effective_factor = max(0.05, min(1.25, shock_factor + noise))

        brent = round(baseline_brent + shock * effective_factor, 1)
        risk = int(min(100, max(20, base_risk * (0.45 + 0.55 * effective_factor))))
        gap = round(base_gap * effective_factor, 2)

        # Dynamic SPR reserve drawdown & recovery curve
        if gap > 0.2 and d <= int(total_days * 0.75):
            daily_drawdown = (base_gap / max(1.0, spr_start)) * 14.0 * effective_factor
            spr_level = max(10.0, spr_level - daily_drawdown)
        else:
            # Alternate procurement cargoes arriving — SPR recovery phase
            spr_level = min(95.0, spr_level + 0.6)

        action = None
        if d == 1:
            action = f"Risk signal detected for {scenario.get('name', 'Scenario')} — Monitoring elevated"
        elif d == 3:
            action = f"SPR drawdown of {base_gap:.1f}M bbl/day authorized"
        elif d == 5:
            action = f"Alternate procurement orders placed ({scenario.get('safe_suppliers', ['West Africa'])[0]} route)"
        elif d == max(15, int(total_days * 0.7)):
            action = "Alternate cargo vessels arriving — Supply gap closing"
        elif d == max(20, int(total_days * 0.85)):
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
        f"Activate strategic reserve drawdown ({base_gap:.1f}M bbl/day) and reroute crude procurement to {alt_suppliers} "
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
