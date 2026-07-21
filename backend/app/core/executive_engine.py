"""
Executive Engine — Purely Deterministic Structured Executive Summary Builder.
Consolidates PipelineState sections into a structured executive JSON payload.
Computes overall pipeline confidence across all preceding engine confidences.
Does NOT generate natural language reports (reserved for future Phase 6 Executive Report AI Agent).
"""
import time
from datetime import datetime, timezone
from typing import Any, List

from app.pipeline.models import (
    ExecutiveSection, KPIData, ExecutiveIncidentItem, ExecutiveDemoEvent,
    ExecutiveDemoState, ExecutiveBrief, BriefSectionModel,
    ExplanationMetadata, CalculationMetadata, compute_hash,
)
from app.core.brief_engine import generate_brief

INCIDENT_FEEDS = {
    "hormuz_closure": [
        {"id": 1, "time": "09:15", "type": "CRITICAL", "title": "Strait of Hormuz tension escalates",
         "detail": "Iranian naval exercises causing 18% shipping delay", "region": "Middle East", "color": "red"},
        {"id": 2, "time": "09:30", "type": "WARNING", "title": "OPEC+ emergency meeting called",
         "detail": "Production cut of 1.2M bbl/day expected announcement", "region": "Vienna", "color": "amber"},
        {"id": 3, "time": "10:00", "type": "INFO", "title": "West Africa cargo rerouted",
         "detail": "VLCC MV Bharat Star rerouted via Cape of Good Hope", "region": "West Africa", "color": "blue"},
        {"id": 4, "time": "10:30", "type": "WARNING", "title": "Brent crude +$8.4 surge",
         "detail": "Geopolitical risk premium driving price spike to $96.4/bbl", "region": "Global", "color": "amber"},
        {"id": 5, "time": "10:45", "type": "INFO", "title": "SPR drawdown initiated",
         "detail": "Emergency release of 8.5M bbl authorized pending Cabinet", "region": "India", "color": "green"},
    ],
    "opec_cut": [
        {"id": 1, "time": "08:00", "type": "CRITICAL", "title": "OPEC+ emergency cut confirmed",
         "detail": "2M bbl/day cut — Saudi and UAE leading reduction", "region": "Vienna", "color": "red"},
        {"id": 2, "time": "09:00", "type": "WARNING", "title": "Brent surges to $94.2/bbl",
         "detail": "Commodity markets reacting to supply reduction announcement", "region": "Global", "color": "amber"},
        {"id": 3, "time": "10:00", "type": "INFO", "title": "Brazil LOI under discussion",
         "detail": "Petrobras contacted for emergency term supply", "region": "Brazil", "color": "blue"},
    ],
    "russia_sanctions": [
        {"id": 1, "time": "06:00", "type": "CRITICAL", "title": "14 Russian VLCCs sanctioned",
         "detail": "OFAC SDN list expanded — P&I coverage withdrawn", "region": "Global", "color": "red"},
        {"id": 2, "time": "08:00", "type": "CRITICAL", "title": "India Russia crude exposure flagged",
         "detail": "22% of India imports affected — compliance review required", "region": "India", "color": "red"},
        {"id": 3, "time": "09:00", "type": "WARNING", "title": "4 shipments blocked by compliance",
         "detail": "Compliance engine halted 4 active Russia-origin shipments", "region": "Indian Ocean", "color": "amber"},
    ],
}

DEFAULT_INCIDENTS = [
    {"id": 1, "time": "09:00", "type": "INFO", "title": "All supply chains nominal",
     "detail": "No disruptions reported across monitored corridors", "region": "Global", "color": "green"},
    {"id": 2, "time": "08:30", "type": "INFO", "title": "SPR levels above target",
     "detail": "Strategic reserve at 64% — above 60% minimum threshold", "region": "India", "color": "green"},
    {"id": 3, "time": "08:00", "type": "INFO", "title": "Brent crude stable at $88/bbl",
     "detail": "No significant price movement in past 24 hours", "region": "Global", "color": "blue"},
]


def execute(state: Any, context: Any) -> Any:
    """
    Execute Executive Engine (Phase 3).
    Assembles structured JSON executive overview for consumption by UI & future Phase 6 AI.
    Calculates overall pipeline confidence.
    """
    t_start = time.perf_counter()
    scenario_id = context.scenario_id
    demo_step = context.demo_step

    # KPI Summary
    risk_score = state.risk.overall_score
    crisis_level = state.risk.crisis_level

    scenario = state.scenario or {}
    kpi_base = scenario.get("kpi", {}) if scenario else {}
    kpi = KPIData(
        risk_score=risk_score,
        crisis_level=crisis_level,
        active_incidents=kpi_base.get("active_incidents", 0),
        supply_gap=f"{state.spr.daily_supply_gap_mbbl}M bbl/day",
        spr_coverage=state.spr.coverage_days,
        active_sanctions=state.compliance.flagged_count,
    )

    # Brent calculation
    brent = 88.0
    if scenario:
        timeline = scenario.get("timeline", [])
        fraction = min(demo_step / max(len(timeline) - 1, 1), 1.0) if timeline else 0.0
        shock = scenario.get("crude_price_spike_usd", 0)
        brent = round(scenario.get("brent_baseline_usd", 88.0) + shock * fraction, 1)

    # Incident feed
    raw_incidents = INCIDENT_FEEDS.get(scenario_id, DEFAULT_INCIDENTS)
    incident_feed = [ExecutiveIncidentItem(**i) for i in raw_incidents]

    # Demo state
    scenario_name = scenario.get("name", "No Active Scenario") if scenario else "No Active Scenario"
    timeline_events = scenario.get("timeline", []) if scenario else []
    total_steps = len(timeline_events)
    idx = min(demo_step, total_steps - 1) if total_steps else 0

    if not scenario or not timeline_events:
        current_event = ExecutiveDemoEvent(
            step=0, time="09:00",
            event="No active scenario. Activate one to start demo.",
            type="INFO", risk=32
        )
    else:
        s = timeline_events[idx]
        current_event = ExecutiveDemoEvent(
            step=s["step"], time=s["time"],
            event=s["event"], type=s["type"], risk=s["risk"]
        )

    activated_at = getattr(context, "activated_at", None)
    if activated_at:
        elapsed_seconds = int((datetime.now(timezone.utc) - activated_at).total_seconds())
        elapsed = f"{elapsed_seconds // 60:02d}:{elapsed_seconds % 60:02d}"
    else:
        elapsed = "00:00"

    demo = ExecutiveDemoState(
        current_step=demo_step,
        total_steps=total_steps,
        current_event=current_event,
        scenario_name=scenario_name,
        elapsed_time=elapsed,
        is_complete=demo_step >= total_steps - 1 if total_steps > 0 else False,
    )

    # Brief Data (deterministic)
    brief_data = generate_brief(
        scenario_id,
        classification="Official / Restricted",
        prepared_for="Ministry of Petroleum and Natural Gas",
    )
    sections = [BriefSectionModel(**sec) for sec in brief_data.get("sections", [])]
    brief = ExecutiveBrief(
        brief_id=brief_data["brief_id"],
        classification=brief_data["classification"],
        prepared_for=brief_data["prepared_for"],
        prepared_by=brief_data["prepared_by"],
        date=brief_data["date"],
        subject=brief_data["subject"],
        sections=sections,
        decision_required=brief_data.get("decision_required", ""),
        timestamp=context.timestamp,
        actions=brief_data.get("actions", []),
    )

    # Structured JSON Executive Summary
    primary_supplier_name = state.procurement.recommended_mix[0].name if state.procurement.recommended_mix else "Diversified Mix"
    current_situation = f"Active scenario '{scenario_name}' at step {demo_step}. National risk index at {risk_score}/100 ({crisis_level})."
    risk_summary = f"Primary threat vector: {', '.join(state.risk.top_contributors[:2])}. Supply gap: {state.spr.daily_supply_gap_mbbl}M bbl/day."
    economic_summary = f"Brent crude at ${brent}/bbl. Annual crude import bill projected at ${state.economic.import_bill_usd_bn}B (+${state.economic.current_account_impact_bn}B CAD impact)."
    recommended_action = f"Execute Motion {state.decision.id}: {state.decision.title}."
    current_supplier_str = f"Primary: {primary_supplier_name} | Secondary: {state.procurement.recommended_mix[1].name if len(state.procurement.recommended_mix)>1 else 'N/A'}"
    spr_status_str = f"Reserve after action: {state.spr.reserve_after_action_mbbl}M bbl ({state.spr.reserve_after_action_pct}% capacity). Coverage: {state.spr.coverage_days} days."
    compliance_status_str = f"Status Level: {state.compliance.status_level}. {state.compliance.legal_summary}"

    # Overall Pipeline Confidence Calculation
    # Weighted average of engine confidences
    engine_confidences = [
        state.risk.confidence,
        state.economic.confidence,
        state.procurement.confidence,
        state.compatibility.confidence,
        state.spr.confidence,
        state.compliance.confidence,
        state.decision.confidence,
    ]
    overall_confidence = round(sum(engine_confidences) / len(engine_confidences), 1)
    state.overall_confidence = overall_confidence

    warnings = state.risk.warnings + state.procurement.warnings + state.compliance.warnings

    explanation = ExplanationMetadata(
        assumptions=["Executive summary consolidates state vectors without natural language LLM generation."],
        formula_used="Overall_Confidence = AVG(Engine_Confidences_i)",
        primary_drivers=[f"Overall Pipeline Confidence: {overall_confidence}%", f"Crisis Level: {crisis_level}"],
        secondary_drivers=["Engine Execution Telemetry", "Audit Trail Verification"],
        sensitivity_factors={"confidence_weight_avg": 1.0},
        limitations=["Executive brief text structure strictly static template; NL reports enabled in Phase 6."]
    )

    t_elapsed = (time.perf_counter() - t_start) * 1000.0
    inp_hash = compute_hash({"scenario_id": scenario_id, "demo_step": demo_step, "risk_score": risk_score})
    out_hash = compute_hash({"overall_confidence": overall_confidence, "brent_price": brent})

    calc_meta = CalculationMetadata(
        execution_time_ms=round(t_elapsed, 2),
        input_hash=inp_hash,
        output_hash=out_hash,
        calculation_version="3.0.0",
        engine_version="3.0.0",
    )

    state.executive = ExecutiveSection(
        kpi=kpi,
        incident_feed=incident_feed,
        risk_signals=state.risk.signals,
        brent_price=brent,
        active_scenario=scenario_id,
        demo_step=demo_step,
        timestamp=context.timestamp,
        current_situation=current_situation,
        risk_summary=risk_summary,
        economic_summary=economic_summary,
        recommended_action=recommended_action,
        current_supplier=current_supplier_str,
        spr_status=spr_status_str,
        compliance_status=compliance_status_str,
        confidence=overall_confidence,
        overall_pipeline_confidence=overall_confidence,
        warnings=warnings,
        demo=demo,
        brief=brief,
        explanation_metadata=explanation,
        calculation_metadata=calc_meta,
    )

    # Sync legacy root fields
    state.update_legacy_fields()
    return state
