"""
Red Team Validator — adversarially critiques AI recommendations.
Deterministic per scenario. Generates structured findings and confidence adjustment.
"""
from typing import Dict, Optional
from app.core.scenario_engine import get_scenario

SCENARIO_CRITIQUES = {
    "hormuz_closure": {
        "critique": (
            "The West Africa recommendation optimises for route safety but underweights "
            "the 22-day ETA exposure. If the Hormuz closure is temporary (<10 days), "
            "the cost premium and ETA delay may exceed the disruption cost. "
            "Additionally, the model assumes Nigerian NLNG delivery schedules remain "
            "unaffected — this has not been validated against current lifting schedules."
        ),
        "weak_assumptions": [
            "Assumes Nigerian Bonny Light lifting schedule is fully available — not confirmed.",
            "Assumes Cape of Good Hope route has no weather disruption (cyclone season active).",
            "Assumes Jamnagar refinery is ready to absorb surge volume immediately.",
            "Does not account for chartering market backlog — freight rates may spike 40%.",
            "Hormuz closure probability window (72 hours) may not trigger full reroute economics.",
        ],
        "ignored_risks": [
            "Cyclone risk in Arabian Sea may affect even Cape route timelines (+3–5 days).",
            "Nigerian port labour dispute history — Q3 delivery delays of 8–12 days recorded.",
            "Jamnagar crude buffer tanks at 81% — limited surge absorption capacity.",
            "Insurance market for VLCC Cape route may harden if Hormuz congestion persists.",
            "USD/INR movement — if rupee depreciates >2%, landed cost advantage narrows.",
        ],
        "confidence_adjustment": -0.08,
        "final_recommendation": (
            "Proceed with West Africa as primary alternate, BUT place parallel inquiry "
            "with Brazil (Petrobras) as insurance. Reduce single-cargo commitment to "
            "60% and maintain 40% optionality for 7 days pending Hormuz status update. "
            "Activate SPR as bridge immediately — do not wait for cargo confirmation."
        ),
    },
    "opec_cut": {
        "critique": (
            "The recommendation to pivot to Brazil and USA assumes spot market availability "
            "at current price indications. OPEC+ cuts will also tighten the Atlantic Basin "
            "spot market within 2 weeks — window for competitive pricing is narrow."
        ),
        "weak_assumptions": [
            "Assumes Atlantic Basin spot availability remains ample post-OPEC cut announcement.",
            "USA export quota has not been factored — SPR release approval timeline is 30–45 days.",
            "Brazilian Petrobras contract requires 60-day notice for spot uplift — not instant.",
            "Model assumes 90-day cut duration; historical OPEC compliance is 72% — actual may be shorter.",
        ],
        "ignored_risks": [
            "Atlantic Basin demand surge from European buyers also pivoting away from OPEC.",
            "Freight rate spike on Atlantic VLCCs — currently 62% utilised, will spike to 95%+.",
            "INR depreciation risk if current account widens beyond 2.1% GDP.",
        ],
        "confidence_adjustment": -0.06,
        "final_recommendation": (
            "Act immediately on Brazil term contract negotiation — spot window closes within "
            "10 days. Parallel USA engagement for 2025 Q4 volumes. Extend SPR drawdown "
            "to 45-day plan to allow contract freight markets to normalise."
        ),
    },
    "russia_sanctions": {
        "critique": (
            "Zeroing out Russian crude immediately creates a 22% supply hole with no "
            "confirmed replacement volume. The compliance engine correctly flags Russia, "
            "but the transition plan assumes replacement volumes are on standby — they are not."
        ),
        "weak_assumptions": [
            "West Africa + Saudi Arabia can absorb 1.1M bbl/day gap — capacity unconfirmed.",
            "Assumes no secondary sanctions risk from continuing any Russia-adjacent banking.",
            "Timeline for OFAC-compliant financing of alternate purchases is 15–20 days — not immediate.",
        ],
        "ignored_risks": [
            "Shadow fleet exposure — 22 unidentified VLCCs detected; some may carry Indian-bound cargoes.",
            "Nayara Energy (Vadinar) refinery runs on Urals crude — compatibility issues with replacement crude.",
            "Banking channels for Saudi/UAE payments may face temporary blockage during sanctions surge.",
        ],
        "confidence_adjustment": -0.10,
        "final_recommendation": (
            "Phase out Russia crude over 45 days, not immediately. Secure West Africa contracts "
            "in week 1 before phasing down Russia. Run Nayara on Arab Heavy blend as Urals "
            "replacement during transition. Full compliance by day 45."
        ),
    },
    "port_disruption": {
        "critique": (
            "Rerouting to Vizag and Ennore is operationally correct but pipeline capacity "
            "from eastern ports to the western industrial corridor is constrained. "
            "The recommendation does not address inland logistics gap."
        ),
        "weak_assumptions": [
            "Vizag port can absorb 3 additional VLCCs simultaneously — berth capacity unconfirmed.",
            "Ennore crude pipeline to Chennai refinery has 80% utilisation — limited headroom.",
            "Cyclone track forecast has ±120km uncertainty — Kochi may also be affected.",
        ],
        "ignored_risks": [
            "Inland trucking cost spike — road logistics will surge if pipeline is at capacity.",
            "Paradip strike resolution timeline is unknown — court injunction timeline is 5–7 days.",
            "Satellite imagery not yet available to confirm Vadinar jetty damage extent.",
        ],
        "confidence_adjustment": -0.05,
        "final_recommendation": (
            "Proceed with Vizag/Ennore rerouting but pre-book additional Ennore berths now. "
            "Engage Paradip labour board immediately for arbitration. Monitor Kochi port status "
            "closely — keep it as fallback only if cyclone track stays north of 15°N."
        ),
    },
}

DEFAULT_CRITIQUE = {
    "critique": "No active scenario selected. Red Team analysis cannot be performed without a specific scenario context.",
    "weak_assumptions": ["No scenario context provided — analysis is hypothetical."],
    "ignored_risks": ["Without scenario data, systemic risks cannot be enumerated."],
    "confidence_adjustment": 0.0,
    "final_recommendation": "Activate a specific scenario before requesting Red Team validation.",
}


def validate_recommendation(recommendation: str, scenario_id: Optional[str], confidence: float) -> Dict:
    """
    Return a deterministic Red Team critique based on scenario.
    """
    critique_data = SCENARIO_CRITIQUES.get(scenario_id, DEFAULT_CRITIQUE)

    adj_confidence = round(max(0.0, min(1.0, confidence + critique_data["confidence_adjustment"])), 2)

    findings = []
    for assumption in critique_data["weak_assumptions"][:3]:
        findings.append({"category": "Weak Assumption", "finding": assumption, "severity": "MEDIUM"})
    for risk in critique_data["ignored_risks"][:2]:
        findings.append({"category": "Ignored Risk", "finding": risk, "severity": "HIGH"})

    return {
        "original_recommendation": recommendation,
        "critique": critique_data["critique"],
        "weak_assumptions": critique_data["weak_assumptions"],
        "ignored_risks": critique_data["ignored_risks"],
        "findings": findings,
        "confidence_original": confidence,
        "confidence_adjusted": adj_confidence,
        "final_recommendation": critique_data["final_recommendation"],
    }
