"""
Decision Engine — Purely Deterministic Policy & Cabinet Motion Synthesizer.
Synthesizes signals from Risk, Economic, Procurement, SPR, and Compliance sections.
Outputs recommended decision, decision score, priority, approval status, impact summary, and confidence.
Red Team validation & NL report generation remain strictly deferred to Phase 6 AI layers.
"""
import copy
import time
from typing import Dict, List, Optional, Any

from app.pipeline.models import (
    DecisionSection,
    ExplanationMetadata, CalculationMetadata, compute_hash,
)

SCENARIO_MOTIONS = {
    "hormuz_closure": {
        "id": "MOT-HORMUZ",
        "title": "Authorize 8.5 MMT SPR Drawdown and West Africa Route Diversion",
        "proposedBy": "UrjaNetra AI Engine",
        "urgency": "CRITICAL",
        "summary": "Activate emergency drawdown of 8.5 MMT from Visakhapatnam and Mangaluru SPR facilities and reroute 4 VLCC tankers via Cape of Good Hope to stabilize domestic crude supply.",
        "members": [
            {"name": "Arjun Mehta", "role": "Commander, NEMC", "vote": "PENDING", "avatar": "AM"},
            {"name": "Priya Sharma", "role": "MoP Secretary", "vote": "FOR", "avatar": "PS"},
            {"name": "Rajiv Kumar", "role": "IOC Chairman", "vote": "FOR", "avatar": "RK"},
            {"name": "Anita Bose", "role": "Finance Ministry", "vote": "AGAINST", "avatar": "AB"},
            {"name": "Suresh Nair", "role": "HPCL Director", "vote": "FOR", "avatar": "SN"},
            {"name": "Vikram Singh", "role": "MEA Representative", "vote": "ABSTAIN", "avatar": "VS"},
        ],
    },
    "opec_cut": {
        "id": "MOT-OPEC",
        "title": "Authorize USA & Brazil Procurement Mix and Extended Drawdown Plan",
        "proposedBy": "Procurement AI",
        "urgency": "HIGH",
        "summary": "Pivot spot and term contract allocations to Brazil and USA suppliers to offset OPEC+ 2.0M bbl/day production cut.",
        "members": [
            {"name": "Arjun Mehta", "role": "Commander, NEMC", "vote": "PENDING", "avatar": "AM"},
            {"name": "Priya Sharma", "role": "MoP Secretary", "vote": "FOR", "avatar": "PS"},
            {"name": "Rajiv Kumar", "role": "IOC Chairman", "vote": "FOR", "avatar": "RK"},
            {"name": "Anita Bose", "role": "Finance Ministry", "vote": "AGAINST", "avatar": "AB"},
            {"name": "Suresh Nair", "role": "HPCL Director", "vote": "ABSTAIN", "avatar": "SN"},
            {"name": "Vikram Singh", "role": "MEA Representative", "vote": "ABSTAIN", "avatar": "VS"},
        ],
    },
    "russia_sanctions": {
        "id": "MOT-RUSSIA",
        "title": "Authorize 45-day Russian Crude Phase-Out and West Africa Transition Plan",
        "proposedBy": "Compliance AI",
        "urgency": "CRITICAL",
        "summary": "Approve immediate suspension of Russian Urals crude purchase tenders and authorize a 45-day transition mix with West African crudes.",
        "members": [
            {"name": "Arjun Mehta", "role": "Commander, NEMC", "vote": "PENDING", "avatar": "AM"},
            {"name": "Priya Sharma", "role": "MoP Secretary", "vote": "FOR", "avatar": "PS"},
            {"name": "Rajiv Kumar", "role": "IOC Chairman", "vote": "FOR", "avatar": "RK"},
            {"name": "Anita Bose", "role": "Finance Ministry", "vote": "FOR", "avatar": "AB"},
            {"name": "Suresh Nair", "role": "HPCL Director", "vote": "FOR", "avatar": "SN"},
            {"name": "Vikram Singh", "role": "MEA Representative", "vote": "ABSTAIN", "avatar": "VS"},
        ],
    },
}

DEFAULT_MOTION = {
    "id": "MOT-MONITOR",
    "title": "System Monitoring and Standard Operations Protocol",
    "proposedBy": "System Admin",
    "urgency": "LOW",
    "summary": "No active threat scenarios. Continue monitoring crude price indices, pipeline health, and reserve levels.",
    "members": [],
}


def execute(state: Any, context: Any) -> Any:
    """
    Execute Decision Engine (Phase 3).
    Deterministic policy synthesizer calculating decision score, priority, status,
    and structured impact summary from prior pipeline sections.
    """
    t_start = time.perf_counter()
    scenario_id = context.scenario_id

    motion = copy.deepcopy(SCENARIO_MOTIONS.get(scenario_id, DEFAULT_MOTION))

    risk_score = state.risk.overall_score
    compliance_status = state.compliance.status_level
    spr_feasible = state.spr.feasible
    import_bill = state.economic.import_bill_usd_bn

    # Decision Score Calculation (0 - 100)
    # Higher score = stronger justification for emergency policy adoption
    base_decision_score = (risk_score * 0.45) + (100.0 if not state.compliance.all_clear else 20.0) * 0.35 + (30.0 if not spr_feasible else 10.0) * 0.20
    decision_score = round(min(max(base_decision_score, 10.0), 99.0), 1)

    # Priority determination
    if risk_score >= 75 or compliance_status == "RED":
        priority = "CRITICAL"
        urgency = "CRITICAL"
    elif risk_score >= 50 or compliance_status == "YELLOW":
        priority = "HIGH"
        urgency = "HIGH"
    elif risk_score >= 30:
        priority = "MEDIUM"
        urgency = "MODERATE"
    else:
        priority = "LOW"
        urgency = "LOW"

    # Required Approvals List
    req_approvals = ["Cabinet Committee on Security (CCS)", "Ministry of Petroleum and Natural Gas"]
    if import_bill > 150.0:
        req_approvals.append("Department of Economic Affairs (MoF)")
    if compliance_status != "GREEN":
        req_approvals.append("Ministry of External Affairs (MEA)")

    # Status resolution
    latest_decision = getattr(context, "latest_decision", {})
    status = "VOTING"
    if latest_decision:
        action = latest_decision.get("action_type", "")
        if "APPROVE" in action:
            status = "APPROVED"
        elif "REJECT" in action:
            status = "REJECTED"

    # Impact Summary JSON
    impact_summary = {
        "supply_gap_mitigated": f"{state.spr.daily_supply_gap_mbbl}M bbl/day",
        "reserve_depletion_impact": f"{state.spr.total_drawdown_required_mbbl}M bbl total drawdown",
        "economic_cost_delta": f"${state.economic.current_account_impact_bn}B CAD impact",
        "compliance_risk_cleared": "100% compliant with SDN exclusions" if state.compliance.all_clear else "Sanctioned cargoes isolated",
    }

    # Confidence calculation: composite confidence of preceding engines
    confidence = round((state.risk.confidence * 0.3 + state.procurement.confidence * 0.3 + state.compliance.confidence * 0.4), 1)

    warnings = []
    if status == "VOTING" and priority == "CRITICAL":
        warnings.append("ACTION REQUIRED: Emergency motion awaiting Commander vote within 4 hours.")

    explanation = ExplanationMetadata(
        assumptions=[
            "Decision motion priority derived deterministically from Risk score and Compliance status level.",
            "Decision score weights: Risk (45%), Compliance Exclusions (35%), SPR Feasibility (20%).",
            "Cabinet quorum fixed at 6 voting representatives.",
        ],
        formula_used="Decision_Score = Risk_Score*0.45 + Compliance_Severity*0.35 + SPR_Constraint*0.20",
        primary_drivers=[f"Motion ID: {motion['id']}", f"Decision Score: {decision_score}", f"Priority: {priority}"],
        secondary_drivers=["Required Approvals Count", "Import Bill CAD Impact"],
        sensitivity_factors={"risk_weight": 0.45, "compliance_weight": 0.35, "spr_weight": 0.20},
        limitations=["Voting outcomes simulate member role profiles deterministically until physical operator vote input."]
    )

    t_elapsed = (time.perf_counter() - t_start) * 1000.0

    inp_hash = compute_hash({"scenario_id": scenario_id, "risk_score": risk_score, "status": status})
    out_hash = compute_hash({"decision_score": decision_score, "priority": priority, "motion_id": motion["id"]})

    calc_meta = CalculationMetadata(
        execution_time_ms=round(t_elapsed, 2),
        input_hash=inp_hash,
        output_hash=out_hash,
        calculation_version="3.0.0",
        engine_version="3.0.0",
    )

    state.decision = DecisionSection(
        id=motion["id"],
        title=motion["title"],
        proposedBy=motion["proposedBy"],
        status=status,
        urgency=urgency,
        priority=priority,
        decision_score=decision_score,
        approval_status=status,
        required_approvals=req_approvals,
        impact_summary=impact_summary,
        votes={"for": 4 if status=="APPROVED" else 3, "against": 1, "abstain": 1},
        quorum=6,
        deadline="4 hours" if priority=="CRITICAL" else "12 hours",
        summary=motion["summary"],
        aiRecommendation="APPROVE" if priority in ("CRITICAL", "HIGH") else "MONITOR",
        aiConfidence=int(confidence),
        confidence=confidence,
        warnings=warnings,
        members=motion.get("members", []),
        latest_decision=latest_decision,
        explanation_metadata=explanation,
        calculation_metadata=calc_meta,
    )
    return state
