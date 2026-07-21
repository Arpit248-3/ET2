"""
Procurement Optimizer — scores and ranks suppliers deterministically.
Evaluates 6 suppliers across price, shipping time, political risk, reliability, insurance, and compatibility.
Enforces hard exclusion on blocked/sanctioned suppliers.
Includes fallback allocation, confidence framework, explanation metadata, and calculation hashes.
"""
import time
from typing import Dict, List, Optional, Any

from app.core.scenario_engine import get_scenario, get_suppliers
from app.pipeline.models import (
    ProcurementSection, SupplierScore,
    ExplanationMetadata, CalculationMetadata, compute_hash,
)

ROUTE_RISK_MAP = {
    "Strait of Hormuz": 85,
    "Persian Gulf": 82,
    "Red Sea": 75,
    "Bab-el-Mandeb": 78,
    "Cape of Good Hope": 20,
    "Atlantic Route": 15,
    "Pacific Route": 15,
}

CRUDE_COMPATIBILITY_MAP = {
    "Arab Light": 95,
    "Murban": 92,
    "Qua Iboe": 88,
    "Lula": 85,
    "Urals": 80,
    "WTI Midland": 90,
}


def optimize_procurement(
    scenario_id: Optional[str] = None,
    demo_step: int = 0,
    target_volume: Optional[float] = None,
    duration_days: Optional[int] = None,
    exclude_routes: Optional[List[str]] = None,
    max_risk_score: Optional[int] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Independent procurement optimization calculation.
    """
    scenario = get_scenario(scenario_id) if scenario_id else None
    suppliers = get_suppliers()

    disrupted_route = scenario.get("disrupted_route") if scenario else None
    disrupted_supplier = scenario.get("disrupted_supplier") if scenario else None
    sanctions_active = (scenario_id and "russia" in scenario_id)

    scored_suppliers = []
    for s in suppliers:
        sup_id = s["id"]
        name = s["name"]
        country = s["country"]
        crude_type = s["crude_type"]
        base_price = s.get("landed_cost_usd_bbl", s.get("base_price_usd_bbl", 85.0))
        base_eta = s["eta_days"]
        base_risk_raw = s.get("route_risk", "LOW")
        base_risk = 80 if base_risk_raw == "HIGH" else (45 if base_risk_raw == "MEDIUM" else 15)
        route = s["route"]
        reliability = s.get("reliability_score", 85)
        availability = s.get("availability", "Available")

        # Sanctions & Blocked Status
        is_blocked = False
        sanctions_status = "CLEARED"
        if country == "Russia" and sanctions_status != "BLOCKED":
            if sanctions_active or (scenario and scenario.get("sanctions_flag")):
                is_blocked = True
                sanctions_status = "BLOCKED (OFAC SDN List)"

        if disrupted_supplier and sup_id == disrupted_supplier:
            is_blocked = True
            sanctions_status = "DISRUPTED (Supply Halted)"

        # Dynamic adjustments
        route_risk = ROUTE_RISK_MAP.get(route, 25)
        if disrupted_route and route == disrupted_route:
            route_risk = min(route_risk + 40, 100)
            eta_adjusted = base_eta + 12  # Cape of Good Hope reroute penalty
            insurance_status = "CRITICAL HIGH (+350%)"
            insurance_penalty = 8.5
        else:
            eta_adjusted = base_eta
            insurance_status = "STANDARD"
            insurance_penalty = 1.2

        landed_cost = round(base_price + insurance_penalty + (eta_adjusted * 0.25), 2)
        refinery_compat = CRUDE_COMPATIBILITY_MAP.get(crude_type, 85)

        # Multi-attribute utility composite score calculation (0 to 100)
        # Higher is better
        price_utility = max(100 - (landed_cost - 70) * 2.5, 0)
        eta_utility = max(100 - eta_adjusted * 3.5, 0)
        risk_utility = max(100 - (base_risk * 0.5 + route_risk * 0.5), 0)
        reliability_utility = float(reliability)
        compat_utility = float(refinery_compat)

        score_breakdown = {
            "price_score": round(price_utility * 0.30, 1),
            "eta_score": round(eta_utility * 0.20, 1),
            "risk_score": round(risk_utility * 0.20, 1),
            "reliability_score": round(reliability_utility * 0.15, 1),
            "compatibility_score": round(compat_utility * 0.15, 1),
        }

        composite_score = round(sum(score_breakdown.values()), 1)

        if is_blocked:
            composite_score = 0.0
            verdict = "REJECTED (COMPLIANCE / DISRUPTED)"
            rec_volume = 0.0
        elif composite_score >= 75:
            verdict = "RECOMMENDED (PRIMARY)"
            rec_volume = 1.2  # M bbl/day
        elif composite_score >= 60:
            verdict = "RECOMMENDED (SECONDARY)"
            rec_volume = 0.8
        else:
            verdict = "FALLBACK ONLY"
            rec_volume = 0.4

        scored_suppliers.append(SupplierScore(
            supplier_id=sup_id,
            name=name,
            country=country,
            crude_type=crude_type,
            route=route,
            landed_cost_usd_bbl=landed_cost,
            eta_days=eta_adjusted,
            risk_score=int(route_risk),
            composite_score=composite_score,
            sanctions_status=sanctions_status,
            insurance_status=insurance_status,
            availability=availability,
            refinery_compatibility=refinery_compat,
            reliability_score=reliability,
            verdict=verdict,
            recommended_volume_mbbl=rec_volume,
            score_breakdown=score_breakdown,
        ))

    # Sort descending by composite score
    scored_suppliers.sort(key=lambda x: x.composite_score, reverse=True)

    # Calculate total cost estimate in INR Crores for 30 days
    valid_suppliers = [s for s in scored_suppliers if s.recommended_volume_mbbl > 0]
    total_mbbl_day = sum(s.recommended_volume_mbbl for s in valid_suppliers) or 4.5
    avg_cost_usd = (sum(s.landed_cost_usd_bbl * s.recommended_volume_mbbl for s in valid_suppliers) / total_mbbl_day) if valid_suppliers else 88.0
    total_cost_cr = round((total_mbbl_day * 1e6 * 30 * avg_cost_usd * 83.5) / 1e7, 2)

    fallback = valid_suppliers[2].model_dump() if len(valid_suppliers) > 2 else (valid_suppliers[-1].model_dump() if valid_suppliers else None)

    return {
        "recommended_mix": [s.model_dump() for s in scored_suppliers],
        "total_cost_estimate_cr": total_cost_cr,
        "coverage_days": 30,
        "risk_summary": f"Top strategy prioritizes {valid_suppliers[0].name} ({valid_suppliers[0].country}) and {valid_suppliers[1].name if len(valid_suppliers)>1 else 'Secondary'} for minimum landed risk.",
        "optimized_for": "Landed Risk Minimization & Compliance Exclusion",
        "fallback_supplier": fallback,
    }


def execute(state: Any, context: Any) -> Any:
    """
    Execute Procurement Engine (Phase 3).
    Evaluates suppliers with strict sanctions exclusion, dynamic scoring,
    fallback allocation, confidence calculation, and metadata hashing.
    """
    t_start = time.perf_counter()
    scenario_id = context.scenario_id
    demo_step = context.demo_step

    raw = optimize_procurement(scenario_id, demo_step)

    # Confidence calculation: risk score + supplier availability
    risk_score = state.risk.overall_score
    blocked_count = sum(1 for s in raw["recommended_mix"] if s["sanctions_status"] != "CLEARED")
    confidence = round(max(92.0 - (risk_score * 0.1) - (blocked_count * 5.0), 55.0), 1)

    warnings = []
    if blocked_count > 0:
        warnings.append(f"COMPLIANCE BLOCK: {blocked_count} supplier(s) excluded due to sanctions or active route disruption.")
    top_sup = raw["recommended_mix"][0]
    if top_sup["eta_days"] > 14:
        warnings.append(f"LOGISTICS ALERT: Primary supplier {top_sup['name']} transit ETA extended to {top_sup['eta_days']} days.")

    explanation = ExplanationMetadata(
        assumptions=[
            "Sanctioned or disrupted suppliers are assigned a composite utility score of 0.0.",
            "Multi-attribute utility weights: Price (30%), ETA (20%), Route Risk (20%), Reliability (15%), Compatibility (15%).",
            "Exchange rate baseline fixed at ₹83.5 per USD for total budget estimates.",
        ],
        formula_used="Composite_Score = Price_Utility*0.3 + ETA_Utility*0.2 + Risk_Utility*0.2 + Reliability*0.15 + Compat*0.15",
        primary_drivers=[f"Primary: {top_sup['name']} (Score: {top_sup['composite_score']})", "Route Safety Index", "Landed Cost USD/bbl"],
        secondary_drivers=["Refinery Assay Match", "P&I Insurance Premium Surcharge"],
        sensitivity_factors={
            "price_weight": 0.30,
            "eta_weight": 0.20,
            "risk_weight": 0.20,
        },
        limitations=[
            "Does not model spot contract volume availability ceilings above 2.0M bbl/day.",
            "Freight rates assume 30-day charter lock-in terms.",
        ]
    )

    t_elapsed = (time.perf_counter() - t_start) * 1000.0

    inp_hash = compute_hash({"scenario_id": scenario_id, "demo_step": demo_step, "risk_score": risk_score})
    out_hash = compute_hash(raw)

    calc_meta = CalculationMetadata(
        execution_time_ms=round(t_elapsed, 2),
        input_hash=inp_hash,
        output_hash=out_hash,
        calculation_version="3.0.0",
        engine_version="3.0.0",
    )

    state.procurement = ProcurementSection(
        recommended_mix=[SupplierScore(**s) for s in raw["recommended_mix"]],
        total_cost_estimate_cr=raw["total_cost_estimate_cr"],
        coverage_days=raw["coverage_days"],
        risk_summary=raw["risk_summary"],
        optimized_for=raw["optimized_for"],
        fallback_supplier=raw.get("fallback_supplier"),
        confidence=confidence,
        warnings=warnings,
        explanation_metadata=explanation,
        calculation_metadata=calc_meta,
        timestamp=context.timestamp,
    )
    return state
