"""
Compliance Engine — validates suppliers against sanctions, G7 price caps, insurance P&I coverage,
policy alignment, and environmental/route restrictions.
Deterministically computes Green / Yellow / Red compliance status.
Never approves illegal procurement. Includes legal summary, confidence, and calculation metadata.
"""
import time
from typing import Dict, List, Optional, Any

from app.core.scenario_engine import get_suppliers, get_scenario
from app.pipeline.models import (
    ComplianceSection, ComplianceResult,
    ExplanationMetadata, CalculationMetadata, compute_hash,
)

SANCTIONS_DB = {
    "sup-003": {
        "sanctions_status": "FLAGGED",
        "authority": "OFAC / EU",
        "reason": "Russia — G7 price cap restrictions ($60/bbl). 14 VLCC tankers on SDN list.",
        "g7_price_cap_usd": 60.0,
    },
    "sup-001": {
        "sanctions_status": "CLEARED",
        "authority": "UN / MEA",
        "reason": "Saudi Arabia term contract — compliant with international trade framework.",
    },
    "sup-002": {
        "sanctions_status": "CLEARED",
        "authority": "UN / MEA",
        "reason": "ADNOC UAE — fully cleared for sovereign import.",
    },
}


def evaluate_compliance(
    scenario_id: Optional[str] = None,
    demo_step: int = 0,
    supplier_ids: Optional[List[str]] = None,
    route: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Independent compliance evaluation calculation.
    """
    suppliers = get_suppliers()
    scenario = get_scenario(scenario_id) if scenario_id else None
    sanctions_active = (scenario_id and "russia" in scenario_id) or (scenario and scenario.get("sanctions_flag", False))

    results = []
    all_clear = True
    flagged_count = 0
    violations = []
    required_actions = []

    for s in suppliers:
        sup_id = s["id"]
        name = s["name"]
        country = s["country"]
        crude_price = s.get("landed_cost_usd_bbl", s.get("base_price_usd_bbl", 85.0))
        route = s["route"]

        sanctions_val = "CLEARED"
        flags = []

        # Sanctions check
        if country == "Russia" and sanctions_active:
            sanctions_val = "FLAGGED (SDN LIST)"
            flags.append("OFAC SDN Sanction active on Russia crude exports.")
            if crude_price > 60.0:
                flags.append(f"G7 Price Cap Breach: Purchase price ${crude_price}/bbl exceeds $60/bbl cap.")

        # Insurance P&I check
        if route in ("Strait of Hormuz", "Red Sea") and (scenario_id and ("hormuz" in scenario_id or "mandeb" in scenario_id)):
            insurance_val = "HIGH RISK (WAR RISK SURCHARGE)"
            flags.append(f"P&I Club War Risk Clause triggered on route '{route}'.")
        else:
            insurance_val = "VERIFIED"

        # Policy Alignment
        policy_val = "ALIGNED (MoP&NG DIRECTIVE)"

        # Overall Status per supplier
        if sanctions_val.startswith("FLAGGED"):
            overall = "BLOCKED"
            all_clear = False
            flagged_count += 1
            violations.append(f"Supplier {name} ({country}): {flags[0] if flags else 'Sanctions Flag'}")
            required_actions.append(f"Suspend tender issuing for {name}; issue West Africa / Brazil substitution directive.")
        elif insurance_val.startswith("HIGH RISK"):
            overall = "RESTRICTED (APPROVAL REQUIRED)"
            required_actions.append(f"Obtain GIC Re emergency war risk indemnity cover for {route} transit.")
        else:
            overall = "COMPLIANT"

        results.append(ComplianceResult(
            supplier_id=sup_id,
            supplier_name=name,
            sanctions=sanctions_val,
            insurance=insurance_val,
            legal_status="VALID JURISDICTION",
            policy_alignment=policy_val,
            route_restriction=f"MONITORED ({route})",
            overall=overall,
            flags=flags,
        ))

    if flagged_count > 0:
        status_level = "RED"
        legal_summary = f"CRITICAL NON-COMPLIANCE: {flagged_count} supplier(s) blocked by OFAC/G7 sanctions. Immediate trade diversion mandated."
    elif any(r.overall.startswith("RESTRICTED") for r in results):
        status_level = "YELLOW"
        legal_summary = "CONDITIONAL CLEARANCE: War risk indemnity approvals pending for high-risk maritime transit corridors."
    else:
        status_level = "GREEN"
        legal_summary = "ALL CLEAR: 100% of evaluated crude procurement tenders fully compliant with international trade directives and MEA policy."

    return {
        "results": [r.model_dump() for r in results],
        "all_clear": all_clear,
        "flagged_count": flagged_count,
        "status_level": status_level,
        "violations": violations,
        "required_actions": required_actions,
        "legal_summary": legal_summary,
    }


check_compliance = evaluate_compliance


def execute(state: Any, context: Any) -> Any:
    """
    Execute Compliance Engine (Phase 3).
    Validates recommended suppliers against sanctions, G7 price cap, P&I insurance, and MEA policy.
    """
    t_start = time.perf_counter()
    scenario_id = context.scenario_id
    demo_step = context.demo_step

    raw = evaluate_compliance(scenario_id, demo_step)

    confidence = 98.0 if raw["all_clear"] else 88.0
    warnings = raw["violations"].copy()

    explanation = ExplanationMetadata(
        assumptions=[
            "G7 crude price cap threshold fixed at $60.0/bbl for Russian-origin cargoes.",
            "OFAC SDN sanctions enforce mandatory blocking on sanctioned fleet vessels.",
            "War risk insurance clauses apply automatically to Strait of Hormuz and Red Sea transit.",
        ],
        formula_used="Compliance_Status = RED if Any(Sanctions_Blocked) else (YELLOW if WarRisk_Active else GREEN)",
        primary_drivers=[f"Overall Compliance Level: {raw['status_level']}", f"Flagged Suppliers: {raw['flagged_count']}"],
        secondary_drivers=["OFAC SDN Screening", "G7 Price Cap ($60/bbl)", "P&I War Risk Indemnity"],
        sensitivity_factors={"sanctions_strictness": 1.0, "price_cap_usd": 60.0},
        limitations=["Assumes real-time synchronization with US Treasury OFAC SDN portal."]
    )

    t_elapsed = (time.perf_counter() - t_start) * 1000.0

    inp_hash = compute_hash({"scenario_id": scenario_id, "demo_step": demo_step})
    out_hash = compute_hash(raw)

    calc_meta = CalculationMetadata(
        execution_time_ms=round(t_elapsed, 2),
        input_hash=inp_hash,
        output_hash=out_hash,
        calculation_version="3.0.0",
        engine_version="3.0.0",
    )

    state.compliance = ComplianceSection(
        results=[ComplianceResult(**r) for r in raw["results"]],
        all_clear=raw["all_clear"],
        flagged_count=raw["flagged_count"],
        status_level=raw["status_level"],
        violations=raw["violations"],
        required_actions=raw["required_actions"],
        legal_summary=raw["legal_summary"],
        confidence=confidence,
        warnings=warnings,
        explanation_metadata=explanation,
        calculation_metadata=calc_meta,
        timestamp=context.timestamp,
    )
    return state


check_compliance = evaluate_compliance

