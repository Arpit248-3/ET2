"""
Refinery Compatibility Engine — evaluates crude oil assays against Indian refinery configurations.
Calculates API gravity, sulfur tolerance, blending requirements, and refining cost penalties.
Includes confidence scoring, explanation metadata, and calculation hashing.
"""
import time
from typing import Dict, List, Optional, Any

from app.core.scenario_engine import get_refineries
from app.pipeline.models import (
    CompatibilitySection,
    ExplanationMetadata, CalculationMetadata, compute_hash,
)

CRUDE_ASSAYS = {
    "Arab Light": {"api": 33.4, "sulfur": 1.97, "type": "Medium Sour"},
    "Murban": {"api": 40.2, "sulfur": 0.78, "type": "Light Sweet"},
    "Qua Iboe": {"api": 36.3, "sulfur": 0.14, "type": "Light Sweet"},
    "Lula": {"api": 29.0, "sulfur": 0.37, "type": "Medium Sweet"},
    "Urals": {"api": 31.0, "sulfur": 1.48, "type": "Medium Sour"},
    "WTI Midland": {"api": 41.5, "sulfur": 0.15, "type": "Light Sweet"},
}


def calculate_compatibility(selected_crude: Optional[str] = None) -> Dict[str, Any]:
    """
    Independent refinery compatibility calculation.
    """
    if not selected_crude or selected_crude not in CRUDE_ASSAYS:
        selected_crude = "Arab Light"

    assay = CRUDE_ASSAYS[selected_crude]
    crude_api = assay["api"]
    crude_sulfur = assay["sulfur"]

    refineries_raw = get_refineries()
    evaluated_refineries = []
    recommended_list = []
    total_penalty = 0.0

    for r in refineries_raw:
        r_name = r["name"]
        max_sulfur = r.get("max_sulfur_pct", 2.5)
        min_api = r.get("min_api", 25.0)
        max_api = r.get("max_api", 45.0)
        desulf_capacity = r.get("desulfurization_capacity", "HIGH")

        # Compatibility Scoring Logic
        sulfur_diff = max(crude_sulfur - max_sulfur, 0.0)
        api_penalty = 0.0
        if crude_api < min_api:
            api_penalty = (min_api - crude_api) * 3.0
        elif crude_api > max_api:
            api_penalty = (crude_api - max_api) * 2.0

        base_score = 100.0 - (sulfur_diff * 45.0) - api_penalty
        compat_score = int(min(max(base_score, 10.0), 100.0))

        if compat_score >= 85:
            status = "OPTIMAL MATCH"
            penalty = 0.0
            recommended_list.append(r_name)
        elif compat_score >= 65:
            status = "COMPATIBLE WITH BLENDING"
            penalty = round(1.2 + sulfur_diff * 2.5, 2)
            recommended_list.append(r_name)
        else:
            status = "HIGH METALLURGY PENALTY"
            penalty = round(3.5 + sulfur_diff * 5.0, 2)

        total_penalty += penalty

        evaluated_refineries.append({
            "name": r_name,
            "operator": r.get("operator", "PSU"),
            "capacity_mmtpa": r.get("capacity_mmtpa", 15.0),
            "compatibility_score": compat_score,
            "status": status,
            "refining_penalty_usd_bbl": penalty,
            "desulfurization": desulf_capacity,
        })

    avg_penalty = round(total_penalty / max(len(refineries_raw), 1), 2)

    # Blending Advisory Logic
    if crude_sulfur > 1.5:
        blending_advice = (
            f"HIGH SULFUR WARNING ({crude_sulfur}% wt): Blend {selected_crude} with 35% Light Sweet crude "
            f"(Murban or WTI Midland) to maintain feedstock sulfur <= 1.2% for older PSU hydrotreaters."
        )
    elif crude_api < 30.0:
        blending_advice = (
            f"HEAVY CRUDE ADVISORY (API {crude_api}): Dilute with high-API naphtha or blend with Qua Iboe "
            f"to prevent vacuum distillation tower fouling."
        )
    else:
        blending_advice = f"DIRECT FEEDSTOCK CLEARANCE: {selected_crude} assay is within optimal metallurgy envelope across all major coastal refineries."

    return {
        "crude_options": list(CRUDE_ASSAYS.keys()),
        "selected_crude": selected_crude,
        "refineries": evaluated_refineries,
        "recommended_refineries": recommended_list,
        "blending_advice": blending_advice,
        "refining_cost_penalty_usd": avg_penalty,
    }


def execute(state: Any, context: Any) -> Any:
    """
    Execute Refinery Compatibility Engine (Phase 3).
    Evaluates top recommended crude from Procurement section against refinery metallurgy specs.
    """
    t_start = time.perf_counter()

    # Pick top recommended crude from Procurement engine
    proc_mix = state.procurement.recommended_mix
    valid_mix = [s for s in proc_mix if s.recommended_volume_mbbl > 0]
    selected_crude = valid_mix[0].crude_type if valid_mix else "Arab Light"

    raw = calculate_compatibility(selected_crude)

    confidence = 94.0
    warnings = []
    if raw["refining_cost_penalty_usd"] > 2.0:
        warnings.append(f"REFINING PENALTY ALERT: Assay {selected_crude} incurs an average ${raw['refining_cost_penalty_usd']}/bbl desulfurization penalty.")

    explanation = ExplanationMetadata(
        assumptions=[
            "Refinery metallurgy limits derived from design max sulfur (% wt) and API gravity operating bounds.",
            "Blending cost penalty scales at $2.5/bbl per 1.0% excess sulfur above refinery metallurgy threshold.",
        ],
        formula_used="Compat_Score = 100 - MAX(0, Crude_Sulfur - Max_Sulfur)*45 - API_OutOfBounds_Penalty",
        primary_drivers=[f"Assay Assay: {selected_crude}", "Sulfur Content (% wt)", "API Gravity Degree"],
        secondary_drivers=["Hydrotreater Desulfurization Capacity", "Vacuum Distillation Envelope"],
        sensitivity_factors={"sulfur_penalty_mult": 45.0, "api_penalty_mult": 3.0},
        limitations=["Assumes linear blending volumetric math without non-linear vapor pressure shifts."]
    )

    t_elapsed = (time.perf_counter() - t_start) * 1000.0

    inp_hash = compute_hash({"selected_crude": selected_crude})
    out_hash = compute_hash(raw)

    calc_meta = CalculationMetadata(
        execution_time_ms=round(t_elapsed, 2),
        input_hash=inp_hash,
        output_hash=out_hash,
        calculation_version="3.0.0",
        engine_version="3.0.0",
    )

    state.compatibility = CompatibilitySection(
        crude_options=raw["crude_options"],
        selected_crude=raw["selected_crude"],
        refineries=raw["refineries"],
        recommended_refineries=raw["recommended_refineries"],
        blending_advice=raw["blending_advice"],
        refining_cost_penalty_usd=raw["refining_cost_penalty_usd"],
        confidence=confidence,
        warnings=warnings,
        explanation_metadata=explanation,
        calculation_metadata=calc_meta,
    )
    return state
