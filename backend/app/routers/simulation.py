"""
POST /api/simulate — Run scenario simulation and return 30-day projection
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
        # Baseline projection
        daily_points = [
            SimulationDayPoint(day=d, brent_price=88.0, risk_score=32, spr_level_pct=64.0, supply_gap_mbbl=0.0, action=None)
            for d in range(1, request.duration_days + 1)
        ]
        return SimulationResponse(
            scenario_id=request.scenario_id,
            duration_days=request.duration_days,
            summary={"status": "BASELINE", "note": "No disruption scenario."},
            daily_projection=daily_points,
            recommended_action="No action required.",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    baseline_brent = scenario.get("brent_baseline_usd", 88.0)
    shock = scenario.get("crude_price_spike_usd", 0) * request.severity_multiplier
    base_gap = scenario.get("india_import_gap_mbbl_day", 0)
    base_risk = scenario["kpi"]["risk_score"]
    spr_start = scenario["kpi"]["spr_coverage"]

    daily_points = []
    spr_level = float(spr_start)
    drawdown_per_day = 0.9 / 36.87 * 100  # ~2.4% of capacity per day

    for d in range(1, request.duration_days + 1):
        # Shock peaks at day 5, decays over 30 days
        if d <= 5:
            shock_factor = d / 5
        elif d <= 15:
            shock_factor = 1.0
        else:
            shock_factor = max(0, 1.0 - (d - 15) / (request.duration_days - 15) * 0.6)

        brent = round(baseline_brent + shock * shock_factor, 1)
        risk = int(min(100, base_risk * (0.5 + 0.5 * shock_factor)))
        gap = round(base_gap * shock_factor, 2)

        # SPR depletes during gap period
        if gap > 0 and d <= 22:
            spr_level = max(0, spr_level - drawdown_per_day)
        elif d > 22:
            # Alternate cargo arrives — gap closes
            spr_level = min(spr_start, spr_level + 0.3)

        action = None
        if d == 1:
            action = "Risk signal detected — monitoring elevated"
        elif d == 3:
            action = "SPR drawdown authorized"
        elif d == 5:
            action = "West Africa procurement orders placed"
        elif d == 22:
            action = "Alternate cargo arrives — gap closing"
        elif d == 25:
            action = "Crisis stabilizing — SPR replenishment begins"

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
        "severity": scenario["severity"],
    }

    create_audit_entry(
        db=db,
        user="AI Agent",
        action=f"Simulation Run: {scenario['name']} ({request.duration_days} days)",
        module="Scenario Simulator",
        event_type="AI",
        details={"scenario_id": request.scenario_id, "duration": request.duration_days, "summary": summary},
    )

    return SimulationResponse(
        scenario_id=request.scenario_id,
        duration_days=request.duration_days,
        summary=summary,
        daily_projection=daily_points,
        recommended_action=f"Activate procurement alternate and SPR drawdown within 48 hours. Monitor Hormuz daily.",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
