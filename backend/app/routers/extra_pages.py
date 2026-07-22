import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.database import get_db
from app.models import (
    ScenarioState, DBUser, DBReport, DBDataSource,
    DBCollaborationRoom, DBCollaborationMessage, DBCollaborationApproval,
    DBProfilePreference, AuditLog
)
from app.routers.audit import create_audit_entry

router = APIRouter()

# ─── Pydantic Schemas ────────────────────────────────────────────────────────
class CopilotQueryRequest(BaseModel):
    message: str

class InviteUserRequest(BaseModel):
    name: str
    email: str
    role: str

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class AddMessageRequest(BaseModel):
    sender: str
    sender_role: str
    message: str
    avatar: Optional[str] = "AI"

class ApprovalRequest(BaseModel):
    motion_id: str
    approved_by: str
    status: str  # APPROVED, REJECTED

class PreferenceUpdateRequest(BaseModel):
    theme: Optional[str] = "dark"
    notifications_enabled: Optional[bool] = True
    high_contrast: Optional[bool] = False
    refresh_interval_seconds: Optional[int] = 30

class GeneralSettingsRequest(BaseModel):
    api_endpoint: Optional[str] = None
    auto_refresh: Optional[bool] = True
    active_security_profile: Optional[str] = None
    alert_emails: Optional[str] = None


# ─── 1. Supply Chain Digital Twin ─────────────────────────────────────────────
@router.get("/supply-chain-twin")
def get_supply_chain_twin(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    active_scenario = state.active_scenario_id if state else None

    # Base configuration for nodes with lat/lng coordinates
    nodes = [
        {"id": "jamnagar", "x": 135, "y": 228, "lat": 22.3072, "lng": 73.1812, "label": "Jamnagar Refinery", "type": "refinery", "status": "OPERATIONAL", "capacity": "1.24M bbl/day", "risk": 22},
        {"id": "paradip", "x": 438, "y": 268, "lat": 20.3117, "lng": 85.8180, "label": "Paradip Port", "type": "port", "status": "OPERATIONAL", "capacity": "18M MT/year", "risk": 18},
        {"id": "vizag", "x": 437, "y": 318, "lat": 17.0005, "lng": 81.8040, "label": "Vizag SPR", "type": "spr", "status": "OPERATIONAL", "capacity": "13.3 MMT", "risk": 15},
        {"id": "mangaluru", "x": 285, "y": 398, "lat": 12.8698, "lng": 74.8431, "label": "Mangaluru SPR", "type": "spr", "status": "OPERATIONAL", "capacity": "11.5 MMT", "risk": 20},
        {"id": "kochi", "x": 268, "y": 438, "lat": 9.9312, "lng": 76.2673, "label": "Kochi Refinery", "type": "refinery", "status": "OPERATIONAL", "capacity": "0.31M bbl/day", "risk": 25},
        {"id": "mumbai", "x": 208, "y": 298, "lat": 19.0760, "lng": 72.8777, "label": "Mumbai Port", "type": "port", "status": "OPERATIONAL", "capacity": "62M MT/year", "risk": 30},
        {"id": "chennai", "x": 367, "y": 418, "lat": 13.0827, "lng": 80.2707, "label": "Chennai Refinery", "type": "refinery", "status": "OPERATIONAL", "capacity": "0.21M bbl/day", "risk": 18},
        {"id": "haldia", "x": 476, "y": 228, "lat": 22.5726, "lng": 88.3639, "label": "Haldia Port", "type": "port", "status": "OPERATIONAL", "capacity": "45M MT/year", "risk": 22},
    ]

    routes = [
        {"id": "r1", "from": "basrah", "to": "mumbai", "type": "sea", "status": "ACTIVE"},
        {"id": "r2", "from": "nigeria", "to": "paradip", "type": "sea", "status": "ACTIVE"},
        {"id": "r3", "from": "mumbai", "to": "jamnagar", "type": "pipeline", "status": "ACTIVE"},
        {"id": "r4", "from": "paradip", "to": "vizag", "type": "pipeline", "status": "ACTIVE"},
    ]

    disrupted_routes = []
    active_risk_nodes = []

    # Scenario mutations
    if active_scenario == "hormuz_closure":
        # Jamnagar and Mumbai risk jumps
        for node in nodes:
            if node["id"] in ["jamnagar", "mumbai"]:
                node["risk"] = 84
                node["status"] = "RISK ALERT"
        disrupted_routes = ["Basrah → Mumbai Sea Route"]
        active_risk_nodes = ["mumbai", "jamnagar"]
        routes[0]["status"] = "BLOCKED"
    elif active_scenario == "russia_sanctions":
        for node in nodes:
            if node["id"] in ["paradip", "haldia"]:
                node["risk"] = 62
                node["status"] = "MONITORING"
        active_risk_nodes = ["paradip"]
    elif active_scenario == "port_disruption":
        for node in nodes:
            if node["id"] in ["mumbai", "jamnagar"]:
                node["status"] = "DISRUPTED"
                node["risk"] = 95
        routes[2]["status"] = "OFFLINE"
        active_risk_nodes = ["mumbai", "jamnagar"]

    return {
        "nodes": nodes,
        "routes": routes,
        "ports": [n for n in nodes if n["type"] == "port"],
        "refineries": [n for n in nodes if n["type"] == "refinery"],
        "spr_sites": [n for n in nodes if n["type"] == "spr"],
        "ships": [
            {"name": "MV Bharat Star", "status": "IN TRANSIT", "route": "Nigeria → Paradip", "lat": 10.45, "lon": 65.2},
            {"name": "MT Indian Pride", "status": "AT PORT", "route": "Vizag", "lat": 17.68, "lon": 83.21},
            {"name": "VLCC Kaveri", "status": "IN TRANSIT", "route": "Basrah → Kochi", "lat": 12.0, "lon": 55.4},
        ],
        "disrupted_routes": disrupted_routes,
        "active_risk_nodes": active_risk_nodes
    }


# ─── 2. Refinery Compatibility ────────────────────────────────────────────────

# Crude chemistry profiles — API gravity, sulfur, TAN, viscosity
CRUDE_CHEMISTRY = {
    "Bonny Light (Nigeria)":  {"api": 35.4, "sulfur": 0.14, "tan": 0.10, "viscosity": 4.1, "classification": "Light Sweet",   "origin": "Nigeria"},
    "Arab Light (Saudi)":     {"api": 32.8, "sulfur": 1.80, "tan": 0.05, "viscosity": 6.8, "classification": "Medium Sour",   "origin": "Saudi Arabia"},
    "Basrah Light (Iraq)":    {"api": 33.7, "sulfur": 2.00, "tan": 0.08, "viscosity": 7.2, "classification": "Medium Sour",   "origin": "Iraq"},
    "Urals (Russia)":         {"api": 31.7, "sulfur": 1.62, "tan": 0.12, "viscosity": 8.9, "classification": "Medium Sour",   "origin": "Russia"},
    "Marlim (Brazil)":        {"api": 19.2, "sulfur": 0.77, "tan": 0.35, "viscosity": 195,  "classification": "Heavy Sweet",  "origin": "Brazil"},
    "Murban (UAE)":           {"api": 40.5, "sulfur": 0.78, "tan": 0.06, "viscosity": 3.2, "classification": "Light Sweet",   "origin": "UAE"},
}

# Refinery metallurgical tolerance profiles
REFINERY_PROFILES = [
    {"name": "Jamnagar Refinery (RIL)", "location": "Gujarat", "capacity": "1,240,000 bbl/d",
     "api_min": 28.0, "api_max": 45.0, "sulfur_max": 2.5, "tan_max": 0.30, "viscosity_max": 200,
     "coker": True,  "hydrotreater": True,  "fcc": True,  "notes": "World's largest refinery — widest crude slate tolerance, coker + FCC configuration handles heavy/sour grades."},
    {"name": "Paradip Refinery (IOCL)", "location": "Odisha",  "capacity": "300,000 bbl/d",
     "api_min": 30.0, "api_max": 42.0, "sulfur_max": 2.0, "tan_max": 0.20, "viscosity_max": 50,
     "coker": True,  "hydrotreater": True,  "fcc": True,  "notes": "Modern export-grade refinery; coker allows high-sulfur feeds up to 2.0%."},
    {"name": "Kochi Refinery (BPCL)",   "location": "Kerala",  "capacity": "310,000 bbl/d",
     "api_min": 31.0, "api_max": 43.0, "sulfur_max": 1.8, "tan_max": 0.15, "viscosity_max": 20,
     "coker": False, "hydrotreater": True,  "fcc": False, "notes": "No coker — requires lighter, sweeter crudes. High-sulfur feeds cause CDU corrosion."},
    {"name": "Mumbai Refinery (HPCL)",  "location": "Maharashtra", "capacity": "190,000 bbl/d",
     "api_min": 33.0, "api_max": 45.0, "sulfur_max": 0.5, "tan_max": 0.10, "viscosity_max": 10,
     "coker": False, "hydrotreater": False, "fcc": True,  "notes": "Ageing CDU designed for light Arabian/Iranian crude; no coker or hydrotreater, very sulfur-sensitive."},
    {"name": "Haldia Refinery (IOCL)",  "location": "West Bengal", "capacity": "160,000 bbl/d",
     "api_min": 30.0, "api_max": 40.0, "sulfur_max": 1.5, "tan_max": 0.20, "viscosity_max": 30,
     "coker": False, "hydrotreater": True,  "fcc": True,  "notes": "Modernised FCC with hydrotreater; good for medium-sweet grades, limited by TAN < 0.20 due to older column metallurgy."},
]


# Refinery current utilization rates (realistic operational loads)
REFINERY_UTILIZATION = {
    "Jamnagar Refinery (RIL)":  0.96,  # Near max — world's largest, always running hard
    "Paradip Refinery (IOCL)":  0.88,
    "Kochi Refinery (BPCL)":    0.79,
    "Mumbai Refinery (HPCL)":   0.72,  # Ageing plant, lower throughput
    "Haldia Refinery (IOCL)":   0.83,
}

# Each refinery's historically preferred / optimal crude
REFINERY_OPTIMAL_CRUDE = {
    "Jamnagar Refinery (RIL)":  {"api": 33.0, "sulfur": 1.8, "tan": 0.08, "viscosity": 7.0},
    "Paradip Refinery (IOCL)":  {"api": 32.0, "sulfur": 1.5, "tan": 0.12, "viscosity": 8.0},
    "Kochi Refinery (BPCL)":    {"api": 36.0, "sulfur": 0.9, "tan": 0.08, "viscosity": 5.5},
    "Mumbai Refinery (HPCL)":   {"api": 38.0, "sulfur": 0.3, "tan": 0.06, "viscosity": 4.0},
    "Haldia Refinery (IOCL)":   {"api": 33.0, "sulfur": 1.2, "tan": 0.14, "viscosity": 9.0},
}


def _calc_compatibility(crude: dict, refinery: dict, active_scenario: str = None) -> dict:
    """
    Score 0-100 based on metallurgical and chemical fit.
    Produces realistic 35-96% range across crude/refinery combinations.
    """
    score = 100.0
    ref_name = refinery["name"]

    # ── 1. API Gravity penalties ────────────────────────────────────────────────
    api = crude["api"]
    if api < refinery["api_min"]:
        diff = refinery["api_min"] - api
        # No coker = severe penalty; coker = manageable
        penalty = min(42, diff * 3.2) if not refinery["coker"] else min(22, diff * 1.5)
        score -= penalty
    elif api > refinery["api_max"]:
        diff = api - refinery["api_max"]
        score -= min(18, diff * 2.5)

    # ── 2. Sulfur content penalty ───────────────────────────────────────────────
    sulfur = crude["sulfur"]
    if sulfur > refinery["sulfur_max"]:
        diff = sulfur - refinery["sulfur_max"]
        # No hydrotreater = very heavy penalty
        penalty = min(50, diff * 20) if not refinery["hydrotreater"] else min(22, diff * 8)
        score -= penalty
    # Even within tolerance, high sulfur adds processing complexity
    elif sulfur > refinery["sulfur_max"] * 0.75:
        score -= round((sulfur / refinery["sulfur_max"]) * 3.5, 1)

    # ── 3. TAN (acidity) — non-linear corrosion penalty ────────────────────────
    tan = crude["tan"]
    tan_max = refinery["tan_max"]
    if tan > tan_max:
        excess = tan - tan_max
        # Non-linear: corrosion risk escalates rapidly above tolerance
        penalty = min(35, (excess ** 1.4) * 55)
        score -= penalty
    elif tan > tan_max * 0.80:
        # Within tolerance but approaching limit — minor penalty
        score -= 4

    # ── 4. Viscosity difficulty ─────────────────────────────────────────────────
    visc = crude["viscosity"]
    visc_max = refinery["viscosity_max"]
    if visc > visc_max:
        diff = visc - visc_max
        score -= min(28, diff * 0.12)
    elif visc > visc_max * 0.80:
        score -= 3

    # ── 5. Processing complexity vs optimal crude (deviation penalty) ───────────
    optimal = REFINERY_OPTIMAL_CRUDE.get(ref_name, {})
    if optimal:
        api_dev     = abs(api - optimal["api"]) / 10
        sulfur_dev  = abs(sulfur - optimal["sulfur"]) / 1.5
        tan_dev     = abs(tan - optimal["tan"]) / 0.15
        complexity  = min(14, (api_dev + sulfur_dev + tan_dev) * 3.8)
        score -= complexity

    # ── 6. Utilization factor — overloaded refineries can't handle difficult grades ─
    util = REFINERY_UTILIZATION.get(ref_name, 0.85)
    if util > 0.90 and (tan > 0.15 or sulfur > 1.8):
        score -= 6  # High throughput + difficult crude = blending constraints

    # ── 7. Scenario-aware operational disruption penalty ───────────────────────
    if active_scenario == "hormuz_closure":
        # Gulf refineries face feedstock uncertainty; West Coast ports congested
        if ref_name in ["Jamnagar Refinery (RIL)", "Mumbai Refinery (HPCL)"]:
            score -= 12
        elif ref_name == "Kochi Refinery (BPCL)":
            score -= 8
    elif active_scenario == "port_disruption":
        if ref_name in ["Haldia Refinery (IOCL)", "Paradip Refinery (IOCL)"]:
            score -= 18
    elif active_scenario == "russia_sanctions":
        # Urals is now unavailable — non-Urals crudes see blending readjustment costs
        if crude.get("origin") == "Russia":
            score -= 30
        # Refineries reliant on Urals need reconfiguration
        if ref_name in ["Paradip Refinery (IOCL)", "Haldia Refinery (IOCL)"]:
            score -= 8

    # ── 8. Equipment bonus for challenging grades ───────────────────────────────
    if crude["api"] < 24 and refinery["coker"]:
        score += 6  # Coker refineries get bonus for processing heavy grades they're built for
    if sulfur > 1.5 and refinery["hydrotreater"] and refinery["coker"]:
        score += 4  # Full desulfurisation capability

    score = max(0, min(100, round(score)))
    if score >= 78:
        status = "COMPATIBLE"
    elif score >= 50:
        status = "PARTIAL"
    else:
        status = "INCOMPATIBLE"
    return {"score": score, "status": status}


@router.get("/refinery-compatibility")
def get_refinery_compatibility(crude_type: Optional[str] = None, db: Session = Depends(get_db)):
    # Get active scenario for scenario-aware penalties
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    active_scenario = state.active_scenario_id if state else None

    crude_options = list(CRUDE_CHEMISTRY.keys())
    selected = crude_type if crude_type in crude_options else crude_options[0]
    chem = CRUDE_CHEMISTRY[selected]

    refineries = []
    for ref in REFINERY_PROFILES:
        result = _calc_compatibility(chem, ref, active_scenario=active_scenario)
        refineries.append({
            "name": ref["name"],
            "location": ref["location"],
            "capacity": ref["capacity"],
            "compatibility": result["score"],
            "status": result["status"],
            "coker": ref["coker"],
            "hydrotreater": ref["hydrotreater"],
            "notes": ref["notes"],
            "utilization": round(REFINERY_UTILIZATION.get(ref["name"], 0.85) * 100),
        })

    compatibility_matrix = {
        "gravity_api": chem["api"],
        "sulfur_pct": chem["sulfur"],
        "tan_mg_koh": chem["tan"],
        "viscosity_cst": chem["viscosity"],
        "classification": chem["classification"],
        "origin": chem["origin"],
    }

    # Build dynamic blending advice
    avg_score = sum(r["compatibility"] for r in refineries) / len(refineries)
    compatible_refs = [r["name"].split(" ")[0] for r in refineries if r["status"] == "COMPATIBLE"]
    partial_refs    = [r["name"].split(" ")[0] for r in refineries if r["status"] == "PARTIAL"]
    incompatible_refs = [r["name"].split(" ")[0] for r in refineries if r["status"] == "INCOMPATIBLE"]

    if chem["sulfur"] > 1.5:
        sulf_note = f"High sulfur content ({chem['sulfur']}%wt) mandates hydrotreating at all non-coker sites — expect 8–12% throughput penalty."
    elif chem["sulfur"] > 0.5:
        sulf_note = f"Moderate sulfur ({chem['sulfur']}%wt) — within tolerance for most refineries but adds CDU overhead at HPCL Mumbai."
    else:
        sulf_note = f"Sweet crude ({chem['sulfur']}%wt sulfur) — minimal desulfurisation overhead, compatible with all Indian refinery CDU configurations."

    if chem["api"] < 25:
        grav_note = f"Heavy crude (API {chem['api']}°) demands coker or vacuum distillation. Only Jamnagar and Paradip can process directly without throughput reduction."
    elif chem["api"] > 38:
        grav_note = f"Light crude (API {chem['api']}°) yields high naphtha fraction. Ideal for FCC refineries; Jamnagar and Mumbai achieve best petrol yields."
    else:
        grav_note = f"Medium gravity crude (API {chem['api']}°) provides balanced distillate yield, suitable across most Indian refinery configurations."

    scenario_note = ""
    if active_scenario == "hormuz_closure":
        scenario_note = " [CRISIS: Hormuz closure is causing West Coast port congestion — Jamnagar and Mumbai scores penalised by 8–12 points for operational risk.]"
    elif active_scenario == "port_disruption":
        scenario_note = " [ALERT: Port disruption is impacting Haldia and Paradip — East Coast refineries operating at reduced intake capacity.]"
    elif active_scenario == "russia_sanctions":
        scenario_note = " [SANCTIONS: Russian Urals is unavailable. Refineries calibrated for Urals are being reconfigured — expect 8-point processing adjustment penalty.]"

    blend_str = ""
    if incompatible_refs:
        blend_str = f" For {', '.join(incompatible_refs)} refineries, blend with 30% Arab Light to reduce effective API/sulfur within tolerance limits."

    blending_advice = (
        f"{selected} ({chem['classification']}, Origin: {chem['origin']}). "
        f"{grav_note} {sulf_note} "
        f"Fleet avg compatibility: {round(avg_score)}%. "
        f"Recommended: {', '.join(compatible_refs) if compatible_refs else 'None in full tolerance'}. "
        f"Partial fit: {', '.join(partial_refs) if partial_refs else 'None'}. "
        f"Incompatible: {', '.join(incompatible_refs) if incompatible_refs else 'None'}.{blend_str}{scenario_note}"
    )

    return {
        "crude_options": crude_options,
        "selected_crude": selected,
        "refineries": refineries,
        "compatibility_matrix": compatibility_matrix,
        "recommended_refineries": compatible_refs,
        "blending_advice": blending_advice,
    }




# ─── 3. AI Copilot Query ──────────────────────────────────────────────────────
@router.post("/copilot/query")
def copilot_query(request: CopilotQueryRequest, db: Session = Depends(get_db)):
    msg = request.message.lower().strip()
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    active_scenario = state.active_scenario_id if state else None
    demo_step = state.demo_step if state else 0

    # Fetch latest pipeline result to ensure dynamic values match current state
    from app.models import PipelineResult
    db_result = db.query(PipelineResult).filter(PipelineResult.id == 1).first()
    res_data = db_result.result if db_result else {}

    # If cache is missing or doesn't match active scenario, generate it dynamically!
    from app.routers.pipeline import run_pipeline_internal
    if not res_data or res_data.get("active_scenario_id") != active_scenario or res_data.get("demo_step") != demo_step:
        res_data = run_pipeline_internal(db, active_scenario, demo_step)

    # Extract dynamic state parameters
    brent_price = res_data.get("state", {}).get("brent_price", 88.0)
    scenario_name = res_data.get("demo", {}).get("scenario_name", "No Active Scenario")
    crisis_level = res_data.get("state", {}).get("kpi", {}).get("crisis_level", "NORMAL")
    supply_gap = res_data.get("state", {}).get("kpi", {}).get("supply_gap", "0M bbl/day")
    spr_coverage = res_data.get("state", {}).get("kpi", {}).get("spr_coverage", 64)
    
    # 1. Stock Level Query
    if "stock level" in msg or "crude oil stock" in msg or "how much oil" in msg:
        spr_days = round(spr_coverage * 0.7)
        commercial_days = round(32 + (spr_coverage - 64) * 0.2)
        commercial_volume = round(14.2 + (spr_coverage - 64) * 0.1, 1)
        transit_volume = round(6.2 + (brent_price - 88.0) * 0.1, 1) if brent_price > 88 else 6.2
        total_cover = spr_days + commercial_days
        
        answer = (
            f"Based on the latest telemetry sync from the PPAC database and terminal inventories under the active scenario **{scenario_name}**:\n\n"
            f"• **Strategic Petroleum Reserves (SPR):** Usable stocks are at **{spr_coverage}%** of capacity, representing approximately **{spr_days} days** of net import cover.\n"
            f"• **Commercial Inventories:** Major oil company terminals (IOCL, BPCL, HPCL) hold **{commercial_volume}M bbl** in commercial storage (approx. **{commercial_days} days** of normal refining demand).\n"
            f"• **Offshore/Transit Stocks:** Currently tracked offshore transit is at **{transit_volume}M bbl** of crude.\n\n"
            f"Total combined energy cover is calculated at **{total_cover} days** under {scenario_name} conditions."
        )
        evidence = f"PPAC telemetry sync: Active. Unified SPR at {spr_coverage}%. Cavern telemetry verified within ±0.5% tolerance."
        actions = ["Monitor cavern depletion rates", "Optimize replenishment contract pipeline"]
        linked_pages = ["/spr-planner", "/data-sources"]

    # 2. Hormuz Disruption Risk
    elif "hormuz" in msg or "disruption" in msg or "gulf risk" in msg:
        price_spike = round(brent_price - 88.0, 1)
        cost_spike = round(price_spike * 14.5)
        supply_gap_val = float(supply_gap.replace("M bbl/day", "")) if "M bbl/day" in supply_gap else 0.0
        spr_drawdown_req = round(supply_gap_val * 15 * 0.24, 1)
        cape_rerouting = "ACTIVE" if active_scenario in ["hormuz_closure", "test_custom_gulf_escalation"] else "INACTIVE"
        
        answer = (
            f"A geopolitical risk assessment of the Strait of Hormuz indicates the following:\n\n"
            f"• **Landed Cost Shock:** The risk premium has caused Brent to trade at **${brent_price}/bbl** (a delta of **+${price_spike}** above baseline). This increases the national daily import bill by approximately **₹{cost_spike} Crore**.\n"
            f"• **Supply Exposure:** India normally imports **38%** of its crude through the Strait of Hormuz. Under the current active scenario ({scenario_name}), the active threat level is **{crisis_level}** with a supply gap of **{supply_gap}**.\n"
            f"• **Mitigation:** The AI recommends rerouting tankers via the **Cape of Good Hope** (currently **{cape_rerouting}**) and initiating a **{spr_drawdown_req}M bbl** SPR drawdown to cover the shipping gap."
        )
        evidence = f"AIS tracking: Cape rerouting is {cape_rerouting}. Brent index at ${brent_price}/bbl reflects dynamic scenario risk premium."
        actions = ["Issue Cape route transit directive to VLCC fleet", "Initiate emergency SPR planning protocol"]
        linked_pages = ["/spr-planner", "/procurement-optimizer", "/executive-decision-board"]

    # 3. SPR Drawdown Recommendation
    elif "spr drawdown" in msg or "15-day" in msg or "drawdown recommendation" in msg:
        daily_gap_val = float(supply_gap.replace("M bbl/day", "")) if "M bbl/day" in supply_gap else 0.0
        total_gap = round(daily_gap_val * 15, 1)
        vizag_draw = round(total_gap * 0.45, 1)
        mangaluru_draw = round(total_gap * 0.35, 1)
        padur_draw = round(total_gap * 0.20, 1)
        
        spr_before = spr_coverage
        spr_after = max(20, spr_before - round(total_gap / 1.5))
        remaining_days = round(spr_after * 0.7)
        
        answer = (
            f"The AI Decision Engine has generated the following SPR drawdown schedule for a 15-day crisis window:\n\n"
            f"• **Total Shortfall:** Calculated supply gap is **{daily_gap_val}M bbl/day** (under active scenario {scenario_name}), leading to a cumulative **{total_gap}M bbl** deficit over 15 days.\n"
            f"• **Recommended Cavern Allocation:**\n"
            f"  - *Visakhapatnam (Vizag):* Drawdown **{vizag_draw}M bbl** (allocated from Cavern A/B sweet stocks).\n"
            f"  - *Mangaluru:* Drawdown **{mangaluru_draw}M bbl** (allocated from Cavern B medium-sour).\n"
            f"  - *Padur:* Drawdown **{padur_draw}M bbl** (allocated from Cavern C/D heavy-acidic).\n"
            f"• **Post-Crisis Buffer:** Unified SPR levels will drop from **{spr_before}%** to **{spr_after}%**, leaving a remaining buffer of **{remaining_days} days**."
        )
        evidence = f"Drawdown feasibility: 100%. Flow rates verified for {daily_gap_val}M bbl/day release."
        actions = ["Authorize drawdown order for Cabinet ratification", "Initiate refinery pre-blending protocol for SPR crude"]
        linked_pages = ["/spr-planner"]

    # 4. Compare Crude Prices
    elif "compare crude" in msg or "price" in msg or "brent vs" in msg:
        urals_discount = 12.5 if active_scenario == "russia_sanctions" else 8.0
        urals_price = round(brent_price - urals_discount, 1)
        arab_price = round(brent_price - 1.5, 1)
        arab_landed = round(arab_price + 2.8, 1)
        
        answer = (
            f"Current market index price comparison and differentials (adjusted for freight and risk premium):\n\n"
            f"• **Brent Crude (Global Benchmark):** **${brent_price}/bbl**. Affected by active scenario **{scenario_name}**.\n"
            f"• **Urals (Russia):** **${urals_price}/bbl**. Discount of **-${urals_discount}/bbl** to Brent due to active sanctions and shipping limits.\n"
            f"• **Arab Medium (Saudi Arabia):** **${arab_price}/bbl**. Landed cost of **${arab_landed}/bbl**.\n\n"
            f"*Recommendation:* Focus spot purchasing on discounted sweet grades bypassing Hormuz, such as West African Bonny Light."
        )
        evidence = f"Landed price calculation based on Brent benchmark of ${brent_price}/bbl."
        actions = ["Query spot desk for Bonny Light cargo availability", "Verify G7 price cap compliance for Ural shipping lines"]
        linked_pages = ["/refinery-compatibility", "/procurement-optimizer"]

    # 5. Venezuelan Heavy Crude Refineries
    elif "venezuelan" in msg or "heavy crude" in msg:
        overall_fleet_comp = max(40, 85 - round((brent_price - 88.0) * 0.5))
        jamnagar_score = 92 if active_scenario != "port_disruption" else 65
        
        answer = (
            f"Venezuelan heavy crude (e.g., Merey 16) is a heavy-sour grade characterized by very low API gravity (≈16.0°), high sulfur content (≈2.7%), and high TAN (≈0.50). Suitability analysis under **{scenario_name}**:\n\n"
            f"• **Jamnagar Refinery (RIL):** **COMPATIBLE (Score: {jamnagar_score}/100)**. Equipped with an advanced coker and FCC configuration that easily tolerates highly acidic, heavy crude grades.\n"
            f"• **Paradip Refinery (IOCL):** **PARTIAL COMPATIBILITY (Score: 74/100)**. Coker can process this grade but must blend it with at least 40% light sweet crude to prevent column fouling.\n"
            f"• **Kochi Refinery (BPCL) & Mumbai (HPCL):** **INCOMPATIBLE (Score: <35/100)**. Lacks coker units; column metallurgy will experience severe naphthenic acid corrosion if TAN exceeds 0.15.\n\n"
            f"Overall fleet compatibility is calculated at **{overall_fleet_comp}%** under current system status ({crisis_level})."
        )
        evidence = f"Refinery metallurgical tolerance database. Jamnagar capacity: 1.24M bbl/day."
        actions = ["Update terminal routing parameters for West Coast arrivals", "Initiate light-sweet blending calculations for Paradip coker"]
        linked_pages = ["/refinery-compatibility"]

    # 6. Geopolitical Risks
    elif "geopolitical risks" in msg or "top 5" in msg or "risks this week" in msg:
        signals = res_data.get("risk", {}).get("signals", [])
        if not signals:
            signals = res_data.get("state", {}).get("risk_signals", [])
            
        signal_lines = []
        for i, sig in enumerate(signals[:5]):
            signal_lines.append(f"{i+1}. **{sig['signal']} ({sig['category']} - {sig['score']}% risk):** {sig['source']} - Confidence: {sig['confidence']}%")
            
        if not signal_lines:
            signal_lines = [
                "1. **Strait of Hormuz Naval Drills (CRITICAL - 88% risk):** Escalation could block global tanker transit.",
                "2. **OFAC Sanctions Hardening (HIGH - 75% risk):** Enforcement on Baltic pipelines.",
                "3. **Arabian Sea Weather Interruption (MEDIUM - 52% risk):** Approach road storm threats.",
                "4. **Libyan Oilfields Force Majeure (MODERATE - 45% risk):** Shutting down 300k bbl/day.",
                "5. **Paradip Labor Arbitration (MODERATE - 40% risk):** Minor unloading backlog."
            ]
            
        answer = f"The UrjaNetra Risk Assessment Engine has flagged the following active geopolitical energy risks under scenario **{scenario_name}**:\n\n" + "\n".join(signal_lines)
        evidence = f"Risk engine crawler active. Scanned latest diplomatic and shipping alerts under {scenario_name}."
        actions = ["Examine Suez / West Africa alternative allocations", "Increase Padur SPR alert state to READY"]
        linked_pages = ["/risk-intelligence"]

    # Default fallback
    else:
        answer = (
            f"I am ready to assist with national energy resilience models under the current active scenario **{scenario_name}**.\n\n"
            f"Please query options regarding India's crude stocks, Strait of Hormuz risks, SPR drawdown schedules, "
            f"refinery compatibility parameters, or current geopolitical threats."
        )
        evidence = f"Active scenario: {active_scenario or 'None'}. System threat state: {crisis_level}."
        actions = ["Review baseline threat level", "Calibrate SPR indicators"]
        linked_pages = ["/command-center"]

    create_audit_entry(
        db=db,
        user="Commander Arjun Mehta",
        action=f"AI Copilot Query: '{request.message[:40]}...'",
        module="AI Copilot",
        event_type="AI",
        details={"query": request.message, "active_scenario": active_scenario}
    )

    return {
        "answer": answer,
        "evidence": evidence,
        "recommended_actions": actions,
        "linked_pages": linked_pages,
        "chart_data": {
            "labels": ["SPR Usable", "SPR Drawdown", "Commercial Stocks"],
            "values": [float(spr_coverage), float(spr_coverage * 0.15), 100.0 - spr_coverage]
        }
    }



# ─── 4. Explainable AI ────────────────────────────────────────────────────────
@router.get("/explainability")
def get_explainability(decision: str = "west_africa", db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    active_scenario = state.active_scenario_id if state else None

    # Fetch latest pipeline result to ensure dynamic values match current state
    from app.models import PipelineResult
    db_result = db.query(PipelineResult).filter(PipelineResult.id == 1).first()
    res_data = db_result.result if db_result else {}

    # Extract dynamic state parameters
    brent_price = res_data.get("state", {}).get("brent_price", 88.0)
    scenario_name = res_data.get("demo", {}).get("scenario_name", "No Active Scenario")
    crisis_level = res_data.get("state", {}).get("kpi", {}).get("crisis_level", "NORMAL")
    supply_gap = res_data.get("state", {}).get("kpi", {}).get("supply_gap", "0M bbl/day")
    spr_coverage = res_data.get("state", {}).get("kpi", {}).get("spr_coverage", 64)

    # 1. Procurement switch to West Africa
    if decision == "west_africa":
        freight_delta = round(1.85 + (brent_price - 88.0) * 0.05, 2)
        risk_premium = round(7.40 + (brent_price - 88.0) * 0.25, 2)
        net_benefit = round(risk_premium - freight_delta, 2)
        
        question = "Why did the system prioritize routing spot cargoes via West Africa?"
        answer = (
            f"West Africa route provides a secure physical shipping lane bypassing the Hormuz conflict region. "
            f"Although transport freight costs increase by ${freight_delta}/bbl, the risk premium on Middle East routes has risen to ${risk_premium}/bbl, "
            f"resulting in a net benefit of ${net_benefit}/bbl."
        )
        
        graph = {
            "nodes": [
                {"id": "n1", "label": f"{scenario_name} Disruption"},
                {"id": "n2", "label": f"Freight Cost Delta (+${freight_delta}/bbl)"},
                {"id": "n3", "label": f"Middle East Risk Premium (+${risk_premium}/bbl)"},
                {"id": "n4", "label": f"Net Benefit: +${net_benefit}/bbl"},
                {"id": "n5", "label": "Recommended: West Africa Route"}
            ],
            "edges": [
                {"from": "n1", "to": "n2"},
                {"from": "n1", "to": "n3"},
                {"from": "n2", "to": "n4"},
                {"from": "n3", "to": "n4"},
                {"from": "n4", "to": "n5"}
            ]
        }
        
        freight_pct = round(12 + (brent_price - 88.0) * 0.4)
        risk_reduction = 84 if active_scenario == "hormuz_closure" else 68
        evidence = f"Freight surcharge: +{freight_pct}% vs standard, Risk reduction index: {risk_reduction}% safer."
        confidence = 0.92 if active_scenario == "hormuz_closure" else 0.85
        
        contributions = [
            {"factor": "Geopolitical Safety", "weight": 55 if active_scenario == "hormuz_closure" else 30},
            {"factor": "Metallurgical Compatibility", "weight": 25},
            {"factor": "Freight Premium Delta", "weight": -12},
            {"factor": "Compliance Sanction Clearance", "weight": 12 if active_scenario == "russia_sanctions" else 5}
        ]
        
        cost1 = round(4200 + (brent_price - 88.0) * 15)
        cost2 = round(5800 + (brent_price - 88.0) * 20)
        cost3 = round(7200 + (brent_price - 88.0) * 35)
        alternatives = [
            {"option": "West Africa Route (Bonny Light)", "cost_cr": cost1, "safety": "HIGH", "selected": True},
            {"option": "Suez Canal / Med Spot", "cost_cr": cost2, "safety": "MEDIUM", "selected": False},
            {"option": "Maintain Persian Gulf Route", "cost_cr": cost3, "safety": "CRITICAL", "selected": False}
        ]

    # 2. SPR Drawdown
    elif decision == "spr_drawdown":
        daily_gap_val = 2.4 if active_scenario else 0.0
        total_gap = round(daily_gap_val * 15, 1)
        vizag_draw = round(total_gap * 0.45, 1)
        mangaluru_draw = round(total_gap * 0.35, 1)
        padur_draw = round(total_gap * 0.20, 1)
        
        question = "Why did the system recommend an SPR Drawdown?"
        answer = (
            f"To bridge the import gap of {supply_gap} caused by {scenario_name} while replacement cargoes are in transit (ETA 22 days). "
            f"This prevents refinery shutdown and maintains the national daily processing volume of 5.2M bbl/day."
        )
        
        graph = {
            "nodes": [
                {"id": "n1", "label": f"Supply gap: {supply_gap}"},
                {"id": "n2", "label": f"Replacement cargo ETA: 22 days"},
                {"id": "n3", "label": f"Unified SPR level: {spr_coverage}%"},
                {"id": "n4", "label": f"Safe depletion level (>50%)"},
                {"id": "n5", "label": f"Active: Release {total_gap}M bbl from SPR"}
            ],
            "edges": [
                {"from": "n1", "to": "n3"},
                {"from": "n2", "to": "n3"},
                {"from": "n3", "to": "n4"},
                {"from": "n4", "to": "n5"}
            ]
        }
        
        evidence = f"Usable SPR capacity: {spr_coverage}%. Cavern flow rate: 1,200 m³/hr."
        confidence = 0.87
        
        contributions = [
            {"factor": "Supply Gap Deficit", "weight": 60},
            {"factor": "Cavern Flow Feasibility", "weight": 20},
            {"factor": "Buffer Depletion Cost", "weight": -10},
            {"factor": "Refinery Feed Urgency", "weight": 30}
        ]
        
        cost1 = round(1200 + (brent_price - 88.0) * 5)
        cost2 = round(4800 + (brent_price - 88.0) * 25)
        cost3 = round(5200 + (brent_price - 88.0) * 30)
        alternatives = [
            {"option": "Staged SPR Cavern Drawdown", "cost_cr": cost1, "safety": "HIGH", "selected": True},
            {"option": "Immediate Crude Rationing", "cost_cr": cost2, "safety": "LOW", "selected": False},
            {"option": "Spot Procurement (Hormuz Risk)", "cost_cr": cost3, "safety": "CRITICAL", "selected": False}
        ]

    # 3. Refinery Load Reduction
    elif decision == "refinery_load":
        question = "Why did the system trigger a Refinery Load Reduction Alert?"
        answer = (
            "Due to crude chemistry incompatibilities (high sulfur and TAN) for alternative grades, "
            "Mumbai HPCL refinery load is reduced by 15% to prevent corrosion. Jamnagar is maintained at 100% capacity due to advanced coker metallurgy."
        )
        
        graph = {
            "nodes": [
                {"id": "n1", "label": "Alternative crude sulfur > 1.5%"},
                {"id": "n2", "label": "No coker unit at HPCL Mumbai"},
                {"id": "n3", "label": "Corrosion risk index > safe limit (70)"},
                {"id": "n4", "label": "Action: Reduce throughput by 15%"},
                {"id": "n5", "label": "Maintain Jamnagar at 100% load"}
            ],
            "edges": [
                {"from": "n1", "to": "n3"},
                {"from": "n2", "to": "n3"},
                {"from": "n3", "to": "n4"},
                {"from": "n3", "to": "n5"}
            ]
        }
        
        evidence = "HPCL Mumbai metallurgy lacks coking units, limiting sweet-sour processing elasticity."
        confidence = 0.74
        
        contributions = [
            {"factor": "Crude Chemistry (Sulfur/TAN)", "weight": 50},
            {"factor": "Refinery Coker Availability", "weight": 35},
            {"factor": "Throughput Target Deficit", "weight": -15},
            {"factor": "Maintenance Prevention", "weight": 20}
        ]
        
        cost1 = round(850 + (brent_price - 88.0) * 2)
        cost2 = round(2100 + (brent_price - 88.0) * 10)
        cost3 = round(1400 + (brent_price - 88.0) * 6)
        alternatives = [
            {"option": "Reduce Throughput at Non-Coker Refs", "cost_cr": cost1, "safety": "HIGH", "selected": True},
            {"option": "Run at 100% (High Corrosion Risk)", "cost_cr": cost2, "safety": "CRITICAL", "selected": False},
            {"option": "Custom Chemical Neutralizer Blends", "cost_cr": cost3, "safety": "MEDIUM", "selected": False}
        ]

    # 4. Currency Hedge
    else:
        price_spike = round(brent_price - 88.0, 1)
        cad_widening = round(0.2 + price_spike * 0.1, 2)
        question = "Why did the system trigger a Currency Hedge?"
        answer = (
            f"To protect the national import bill against USD/INR depreciation. "
            f"The projected Brent price spike of ${price_spike}/bbl causes a CAD widening of {cad_widening}%, raising the risk of Rupee depreciation beyond ₹87.5/USD."
        )
        
        graph = {
            "nodes": [
                {"id": "n1", "label": f"Landed Cost Increase: +${price_spike}/bbl"},
                {"id": "n2", "label": f"CAD Widening: {cad_widening}% of GDP"},
                {"id": "n3", "label": "Exchange Volatility > 2.5% annualized"},
                {"id": "n4", "label": "Recommended: Hedge 40% Q3 exposure"},
                {"id": "n5", "label": "Lock in exchange floor at ₹86.8/USD"}
            ],
            "edges": [
                {"from": "n1", "to": "n2"},
                {"from": "n2", "to": "n3"},
                {"from": "n3", "to": "n4"},
                {"from": "n4", "to": "n5"}
            ]
        }
        
        evidence = "USD/INR forward contract rate premium has increased by 18 bps."
        confidence = 0.68
        
        contributions = [
            {"factor": "Landed Cost Bill", "weight": 45},
            {"factor": "CAD Widening Rate", "weight": 35},
            {"factor": "Option Premium Cost", "weight": -15},
            {"factor": "Exchange Volatility", "weight": 25}
        ]
        
        cost1 = round(350 + (brent_price - 88.0) * 1.5)
        cost2 = round(1200 + (brent_price - 88.0) * 8)
        cost3 = round(800 + (brent_price - 88.0) * 4)
        alternatives = [
            {"option": "40% Layered Forward Hedging", "cost_cr": cost1, "safety": "HIGH", "selected": True},
            {"option": "Unhedged Spot Purchases", "cost_cr": cost2, "safety": "LOW", "selected": False},
            {"option": "Bilateral Rupee-Tomb Trade Swaps", "cost_cr": cost3, "safety": "MEDIUM", "selected": False}
        ]

    return {
        "question": question,
        "answer": answer,
        "reason_graph": graph,
        "evidence": evidence,
        "confidence": confidence,
        "factor_contributions": contributions,
        "alternatives": alternatives
    }


# ─── 5. Reports Library ───────────────────────────────────────────────────────
@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(DBReport).order_by(DBReport.timestamp.desc()).all()
    return reports

@router.post("/reports/generate")
def generate_report(db: Session = Depends(get_db)):
    report_id = f"REP-{uuid.uuid4().hex[:4].upper()}"
    title = f"Energy Resilience Assessment — {datetime.now(timezone.utc).strftime('%B %Y')}"
    new_report = DBReport(
        id=report_id,
        title=title,
        format="PDF",
        generated_by="Commander Arjun Mehta",
        size="2.8 MB",
        status="READY"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    create_audit_entry(
        db=db,
        user="Commander Arjun Mehta",
        action=f"Generated Intelligence Report: {title}",
        module="Reports Library",
        event_type="USER",
        details={"report_id": report_id}
    )

    return new_report


# ─── 6. User Management ───────────────────────────────────────────────────────
@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(DBUser).all()
    return users

@router.post("/users/invite")
def invite_user(request: InviteUserRequest, db: Session = Depends(get_db)):
    user_id = request.name.lower().replace(" ", "_")
    
    # Check duplicate
    existing = db.query(DBUser).filter(DBUser.id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already invited.")

    new_user = DBUser(
        id=user_id,
        name=request.name,
        email=request.email,
        role=request.role,
        status="ACTIVE",
        avatar="".join([w[0] for w in request.name.split() if w])[:2].upper()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_audit_entry(
        db=db,
        user="Commander Arjun Mehta",
        action=f"Invited Team Member: {request.name}",
        module="User Management",
        event_type="SECURITY",
        details={"email": request.email, "role": request.role}
    )

    return new_user

@router.patch("/users/{id}")
def update_user(id: str, request: UpdateUserRequest, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if request.name is not None:
        user.name = request.name
    if request.email is not None:
        user.email = request.email
    if request.role is not None:
        user.role = request.role
    if request.status is not None:
        user.status = request.status

    db.commit()
    db.refresh(user)

    create_audit_entry(
        db=db,
        user="Commander Arjun Mehta",
        action=f"Modified User Profile: {id}",
        module="User Management",
        event_type="SECURITY",
        details={"id": id, "new_details": request.dict(exclude_none=True)}
    )

    return user

@router.delete("/users/{id}")
def delete_user(id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    db.delete(user)
    db.commit()

    create_audit_entry(
        db=db,
        user="Commander Arjun Mehta",
        action=f"Deleted User: {id}",
        module="User Management",
        event_type="SECURITY"
    )

    return {"success": True, "message": f"User {id} deleted successfully."}


# ─── 7. Data Sources ──────────────────────────────────────────────────────────
@router.get("/data-sources")
def get_data_sources(db: Session = Depends(get_db)):
    return db.query(DBDataSource).all()

@router.post("/data-sources/refresh")
def refresh_data_source(payload: Dict[str, str], db: Session = Depends(get_db)):
    source_id = payload.get("id")
    source = db.query(DBDataSource).filter(DBDataSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found.")

    source.last_sync_time = "Just now"
    source.records_count += 450
    db.commit()
    db.refresh(source)

    create_audit_entry(
        db=db,
        user="Commander Arjun Mehta",
        action=f"Refreshed Telemetry Data Link: {source.name}",
        module="Data Sources",
        event_type="USER",
        details={"source_id": source_id}
    )

    return source


# ─── 8. Collaboration Rooms & Message Feed ───────────────────────────────────
@router.get("/collaboration/rooms")
def get_collab_rooms(db: Session = Depends(get_db)):
    return db.query(DBCollaborationRoom).all()

@router.get("/collaboration/rooms/{id}/messages")
def get_collab_messages(id: str, db: Session = Depends(get_db)):
    messages = db.query(DBCollaborationMessage).filter(DBCollaborationMessage.room_id == id).all()
    return messages

@router.post("/collaboration/rooms/{id}/messages")
def add_collab_message(id: str, request: AddMessageRequest, db: Session = Depends(get_db)):
    new_msg = DBCollaborationMessage(
        room_id=id,
        sender=request.sender,
        sender_role=request.sender_role,
        message=request.message,
        timestamp=datetime.now().strftime("%I:%M %p"),
        avatar=request.avatar
    )
    db.add(new_msg)
    db.commit()

    return db.query(DBCollaborationMessage).filter(DBCollaborationMessage.room_id == id).all()

@router.post("/collaboration/approvals")
def record_collab_approval(request: ApprovalRequest, db: Session = Depends(get_db)):
    approval = DBCollaborationApproval(
        motion_id=request.motion_id,
        status=request.status,
        requested_by="NEMC Board",
        approved_by=request.approved_by
    )
    db.add(approval)
    db.commit()

    create_audit_entry(
        db=db,
        user=request.approved_by,
        action=f"Crisis Approval Registered: {request.motion_id} — {request.status}",
        module="Collaboration Board",
        event_type="USER",
        details={"motion": request.motion_id}
    )

    return {"success": True, "status": request.status}


# ─── 9. User Profile Preferences ──────────────────────────────────────────────
@router.get("/profile")
def get_profile(db: Session = Depends(get_db)):
    pref = db.query(DBProfilePreference).filter(DBProfilePreference.id == 1).first()
    if not pref:
        # Fallback seeder
        pref = DBProfilePreference(id=1, user_id="arjun_mehta", theme="dark", notifications_enabled=True, high_contrast=False, refresh_interval_seconds=30)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return {
        "id": "arjun_mehta",
        "name": "Arjun Mehta",
        "role": "Commander, NEMC",
        "email": "arjun.mehta@nemc.gov.in",
        "avatar": "AM",
        "preferences": pref
    }

@router.put("/profile/preferences")
def update_preferences(request: PreferenceUpdateRequest, db: Session = Depends(get_db)):
    pref = db.query(DBProfilePreference).filter(DBProfilePreference.id == 1).first()
    if not pref:
        pref = DBProfilePreference(id=1, user_id="arjun_mehta")
        db.add(pref)

    pref.theme = request.theme
    pref.notifications_enabled = request.notifications_enabled
    pref.high_contrast = request.high_contrast
    pref.refresh_interval_seconds = request.refresh_interval_seconds
    db.commit()
    db.refresh(pref)

    return pref


# ─── 10. Help Center ──────────────────────────────────────────────────────────
@router.get("/help-center")
def get_help_center(query: Optional[str] = None):
    articles = [
        {"id": "art-1", "title": "Strategic Petroleum Reserve Drawdown Guidelines", "category": "SPR Operations", "summary": "Detailed protocol for initiating staged cavern releases during supply disruptions."},
        {"id": "art-2", "title": "Refinery Chemistry Blending Advisory Manual", "category": "Refinery Fit", "summary": "Reference charts mapping API gravity and sulfur tolerances for major coastal facilities."},
        {"id": "art-3", "title": "Audit Logs Compliance Auditing Guide", "category": "Compliance", "summary": "Procedure for exporting verified audit chains to international oversight boards."},
        {"id": "art-4", "title": "AI Copilot Command Syntax Reference", "category": "AI Copilot", "summary": "Keywords and semantic flags to customize scenario projection outputs."}
    ]

    if query:
        q = query.lower()
        articles = [a for a in articles if q in a["title"].lower() or q in a["summary"].lower() or q in a["category"].lower()]

    return articles


# ─── 11. General System Settings ──────────────────────────────────────────────
@router.get("/settings")
def get_general_settings(db: Session = Depends(get_db)):
    # Serve deterministic settings state
    return {
        "api_endpoint": "http://localhost:8000/api",
        "auto_refresh": True,
        "active_security_profile": "Standard NATO-Level AES256",
        "alert_emails": "alerts@nemc.gov.in",
        "engines": {
            "scenario": "ACTIVE",
            "risk": "ACTIVE",
            "compliance": "ACTIVE",
            "redteam": "ACTIVE"
        }
    }

@router.put("/settings")
def update_general_settings(request: GeneralSettingsRequest, db: Session = Depends(get_db)):
    create_audit_entry(
        db=db,
        user="Commander Arjun Mehta",
        action="Updated Platform General Settings",
        module="Settings Workspace",
        event_type="USER",
        details=request.dict(exclude_none=True)
    )

    return {
        "success": True,
        "updated_settings": request.dict(exclude_none=True),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ─── 12. Profile Management ─────────────────────────────────────────────
PROFILE_STORE = {
    "name": "Arjun Mehta",
    "email": "arjun.mehta@nemc.gov.in",
    "role": "Commander",
    "department": "National Energy Management Council",
    "location": "New Delhi, India",
    "phone": "+91 98100 00001",
    "clearance": "TOP SECRET",
    "bio": "Commander at NEMC with 18 years of experience in energy policy, crisis management, and strategic reserves planning.",
    "preferences": {
        "theme": "dark",
        "notifications_enabled": True
    }
}

@router.get("/profile")
def get_user_profile(db: Session = Depends(get_db)):
    return PROFILE_STORE

@router.post("/profile")
def update_user_profile(payload: dict, db: Session = Depends(get_db)):
    PROFILE_STORE.update(payload)
    create_audit_entry(
        db=db,
        user=PROFILE_STORE["name"],
        action="Updated User Profile Details",
        module="Profile Workspace",
        event_type="USER",
        details=payload
    )
    return {
        "success": True,
        "profile": PROFILE_STORE,
        "message": "Profile updated successfully",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

