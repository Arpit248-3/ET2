"""
Risk Engine — calculates composite risk score deterministically from scenario data.
Dynamic context-aware weights. Deterministic confidence scoring.
Full structured explanation & calculation metadata for replayability.
"""
import time
from typing import Dict, List, Optional, Any

from app.core.scenario_engine import get_scenario, get_thresholds
from app.pipeline.models import (
    RiskSection, RiskComponent, RiskSignal,
    ExplanationMetadata, CalculationMetadata, compute_hash,
)

# Base Component Weights
DEFAULT_WEIGHTS = {
    "geopolitical_threat": 0.20,
    "maritime_delay": 0.15,
    "insurance_multiplier": 0.10,
    "port_availability": 0.10,
    "weather_severity": 0.05,
    "cyber_threat": 0.05,
    "market_volatility": 0.15,
    "opec_uncertainty": 0.10,
    "inventory_buffer": 0.10,
}


def _get_dynamic_weights(scenario_id: Optional[str]) -> Dict[str, float]:
    """
    Adjust weights dynamically based on scenario category.
    Ensures relevant risk vectors dominate during specific crises.
    """
    weights = DEFAULT_WEIGHTS.copy()
    if not scenario_id:
        return weights

    sid = scenario_id.lower()
    if "hormuz" in sid or "malacca" in sid or "mandeb" in sid:
        weights["maritime_delay"] = 0.30
        weights["geopolitical_threat"] = 0.25
        weights["insurance_multiplier"] = 0.15
        weights["weather_severity"] = 0.05
        weights["cyber_threat"] = 0.05
        weights["port_availability"] = 0.10
        weights["market_volatility"] = 0.05
        weights["opec_uncertainty"] = 0.05
    elif "opec" in sid or "supply_cut" in sid:
        weights["opec_uncertainty"] = 0.35
        weights["market_volatility"] = 0.25
        weights["geopolitical_threat"] = 0.15
        weights["inventory_buffer"] = 0.15
        weights["maritime_delay"] = 0.05
        weights["weather_severity"] = 0.05
    elif "port" in sid or "cyclone" in sid or "biparjoy" in sid:
        weights["weather_severity"] = 0.30
        weights["port_availability"] = 0.30
        weights["maritime_delay"] = 0.20
        weights["geopolitical_threat"] = 0.05
        weights["cyber_threat"] = 0.05
        weights["opec_uncertainty"] = 0.05
        weights["market_volatility"] = 0.05
    elif "cyber" in sid or "scada" in sid:
        weights["cyber_threat"] = 0.40
        weights["port_availability"] = 0.20
        weights["geopolitical_threat"] = 0.15
        weights["market_volatility"] = 0.15
        weights["weather_severity"] = 0.05
        weights["maritime_delay"] = 0.05
    elif "russia" in sid or "sanctions" in sid:
        weights["geopolitical_threat"] = 0.35
        weights["insurance_multiplier"] = 0.25
        weights["market_volatility"] = 0.20
        weights["maritime_delay"] = 0.10
        weights["inventory_buffer"] = 0.10

    # Normalize weights to sum to 1.0
    total = sum(weights.values())
    return {k: round(v / total, 4) for k, v in weights.items()}


def calculate_risk(scenario_id: Optional[str] = None, demo_step: int = 0) -> Dict[str, Any]:
    """
    Independent calculation function — legacy interface support.
    """
    scenario = get_scenario(scenario_id) if scenario_id else None
    weights = _get_dynamic_weights(scenario_id)

    if not scenario:
        # Base nominal state
        components = [
            RiskComponent(name="Geopolitical Threat", value=20, weight=weights["geopolitical_threat"], weighted_score=20*weights["geopolitical_threat"], label="Nominal"),
            RiskComponent(name="Maritime Delay", value=15, weight=weights["maritime_delay"], weighted_score=15*weights["maritime_delay"], label="Normal Transit"),
            RiskComponent(name="Insurance Multiplier", value=10, weight=weights["insurance_multiplier"], weighted_score=10*weights["insurance_multiplier"], label="Standard Rates"),
            RiskComponent(name="Port Availability", value=10, weight=weights["port_availability"], weighted_score=10*weights["port_availability"], label="Fully Operational"),
            RiskComponent(name="Weather Severity", value=5, weight=weights["weather_severity"], weighted_score=5*weights["weather_severity"], label="Clear Seas"),
            RiskComponent(name="Cyber Threat", value=5, weight=weights["cyber_threat"], weighted_score=5*weights["cyber_threat"], label="Secure Telemetry"),
            RiskComponent(name="Market Volatility", value=20, weight=weights["market_volatility"], weighted_score=20*weights["market_volatility"], label="Low Volatility"),
            RiskComponent(name="OPEC Uncertainty", value=15, weight=weights["opec_uncertainty"], weighted_score=15*weights["opec_uncertainty"], label="Stable Output"),
            RiskComponent(name="Inventory Buffer", value=20, weight=weights["inventory_buffer"], weighted_score=20*weights["inventory_buffer"], label="Adequate Reserve"),
        ]
        total_score = int(sum(c.weighted_score for c in components))
        return {
            "overall_score": total_score,
            "crisis_level": "NORMAL",
            "components": [c.model_dump() for c in components],
            "signals": [
                {"id": 1, "source": "AIS Shipping Feeds", "signal": "Normal vessel traffic across Arabian Sea", "score": 12, "confidence": 98, "trend": "STABLE", "category": "MARITIME"},
                {"id": 2, "source": "OPEC Telemetry", "signal": "Production quotas maintained at target levels", "score": 15, "confidence": 95, "trend": "STABLE", "category": "SUPPLY"},
            ],
            "recommendation": "Maintain standard operational monitoring.",
            "top_contributors": ["Geopolitical Threat", "Market Volatility"],
            "affected_regions": ["Global Markets"],
        }

    # Derive raw values from scenario parameters & step progression
    params = scenario.get("parameters", {})
    timeline = scenario.get("timeline", [])
    step_count = max(len(timeline) - 1, 1)
    progress = min(demo_step / step_count, 1.0)

    # Progression multiplier
    step_risk_bump = timeline[min(demo_step, len(timeline)-1)].get("risk", 50) if timeline else 50
    severity_factor = (step_risk_bump / 50.0)

    geo_val = min(params.get("geopolitical_risk", 25) * severity_factor, 100)
    delay_val = min((params.get("maritime_delay_days", 2) / 14.0 * 100) * severity_factor, 100)
    ins_val = min((params.get("insurance_premium_multiplier", 1.0) - 1.0) / 4.0 * 100 * severity_factor, 100)
    port_val = min((1.0 - params.get("port_capacity_fraction", 0.9)) * 100 * severity_factor, 100)
    weather_val = min(params.get("weather_severity_idx", 10) * severity_factor, 100)
    cyber_val = min(params.get("cyber_threat_idx", 10) * severity_factor, 100)
    volatility_val = min(params.get("market_volatility_idx", 20) * severity_factor, 100)
    opec_val = min(params.get("opec_cut_mbbl", 0) / 3.0 * 100 * severity_factor, 100)
    buffer_val = max(100 - (params.get("inventory_days", 45) / 60.0 * 100), 0)

    raw_components = {
        "Geopolitical Threat": (geo_val, weights["geopolitical_threat"]),
        "Maritime Delay": (delay_val, weights["maritime_delay"]),
        "Insurance Multiplier": (ins_val, weights["insurance_multiplier"]),
        "Port Availability": (port_val, weights["port_availability"]),
        "Weather Severity": (weather_val, weights["weather_severity"]),
        "Cyber Threat": (cyber_val, weights["cyber_threat"]),
        "Market Volatility": (volatility_val, weights["market_volatility"]),
        "OPEC Uncertainty": (opec_val, weights["opec_uncertainty"]),
        "Inventory Buffer": (buffer_val, weights["inventory_buffer"]),
    }

    comp_list = []
    total_score = 0.0
    for name, (val, w) in raw_components.items():
        w_score = val * w
        total_score += w_score
        label = "CRITICAL" if val >= 75 else ("HIGH" if val >= 50 else ("ELEVATED" if val >= 30 else "NOMINAL"))
        comp_list.append(RiskComponent(
            name=name, value=round(val, 1), weight=round(w, 4),
            weighted_score=round(w_score, 1), label=label
        ))

    overall_score = int(min(max(total_score, 0), 100))

    if overall_score >= 75:
        crisis_level = "CRITICAL"
        rec = "ACTIVATE EMERGENCY DRAWDOWN AND REALLOCATE PROCUREMENT TO NON-DISRUPTED CORRIDORS."
    elif overall_score >= 60:
        crisis_level = "ELEVATED"
        rec = "PREPARE SPR DRAWDOWN PLAN AND MONITORED REROUTING."
    elif overall_score >= 40:
        crisis_level = "MODERATE"
        rec = "INCREASE SURVEILLANCE OF SHIPPING LANES AND SPOT MARKET SPREADS."
    else:
        crisis_level = "NORMAL"
        rec = "SYSTEM NOMINAL. STANDARD OPERATING MONITORING."

    # Top drivers
    sorted_comps = sorted(comp_list, key=lambda c: c.weighted_score, reverse=True)
    top_drivers = [c.name for c in sorted_comps[:3]]

    signals = [
        RiskSignal(id=1, source="NEMC Maritime Sensor", signal=f"{sorted_comps[0].name} elevated to {sorted_comps[0].value}/100", score=int(sorted_comps[0].value), confidence=94, trend="UP", category="SECURITY"),
        RiskSignal(id=2, source="Global Intelligence Feed", signal=f"Secondary threat vector {sorted_comps[1].name} at {sorted_comps[1].value}/100", score=int(sorted_comps[1].value), confidence=91, trend="UP", category="SUPPLY"),
        RiskSignal(id=3, source="Port Telemetry", signal=f"Chokepoint availability risk rated {sorted_comps[2].value}/100", score=int(sorted_comps[2].value), confidence=89, trend="STABLE", category="INFRASTRUCTURE"),
    ]

    return {
        "overall_score": overall_score,
        "crisis_level": crisis_level,
        "components": [c.model_dump() for c in comp_list],
        "trend": "stable",
        "signals": [s.model_dump() for s in signals],
        "recommendation": rec,
        "top_contributors": top_drivers,
        "affected_regions": scenario.get("affected_regions", ["Global Corridors"]),
        "future_projection": {
            "24h": min(overall_score + 4, 100),
            "48h": min(overall_score + 8, 100),
            "72h": max(overall_score - 2, 0),
        }
    }


def execute(state: Any, context: Any) -> Any:
    """
    Execute Risk Engine (Phase 3).
    Deterministic calculation with dynamic context weights, confidence scoring,
    and structured JSON explanation & calculation metadata.
    """
    t_start = time.perf_counter()
    scenario_id = context.scenario_id
    demo_step = context.demo_step

    raw = calculate_risk(scenario_id, demo_step)

    # Deterministic Confidence Calculation
    # Based on input completeness and variance
    scenario = state.scenario or {}
    completeness = len(scenario) / 15.0 if scenario else 0.8
    confidence_score = round(min(max(80.0 + completeness * 15.0 - (raw["overall_score"] * 0.05), 50.0), 99.0), 1)

    warnings = []
    if raw["overall_score"] > 80:
        warnings.append("CRITICAL: Overall national energy supply risk exceeds severe threshold (>80/100).")
    if scenario_id and "hormuz" in scenario_id:
        warnings.append("WARNNG: Strait of Hormuz chokepoint disruption active — maritime delay weight escalated.")

    weights_used = _get_dynamic_weights(scenario_id)
    top_drivers = raw["top_contributors"]

    explanation = ExplanationMetadata(
        assumptions=[
            "Linear progression of risk parameters across demo timeline steps.",
            "Dynamic component weights scale according to primary scenario threat category.",
            "Baseline risk assumes uninterrupted maritime passage and normal port capacity.",
        ],
        formula_used="Overall_Risk = SUM(Component_Value_i * Dynamic_Weight_i) bounded [0, 100]",
        primary_drivers=top_drivers,
        secondary_drivers=[c["name"] for c in raw["components"] if c["name"] not in top_drivers][:3],
        sensitivity_factors={k: round(v * 100, 2) for k, v in weights_used.items()},
        limitations=[
            "Does not account for non-linear panic buying market feedback loops.",
            "Assumes static weight allocation within a single execution step.",
        ]
    )

    t_elapsed = (time.perf_counter() - t_start) * 1000.0

    inp_hash = compute_hash({"scenario_id": scenario_id, "demo_step": demo_step, "params": scenario.get("parameters", {})})
    out_hash = compute_hash(raw)

    calc_meta = CalculationMetadata(
        execution_time_ms=round(t_elapsed, 2),
        input_hash=inp_hash,
        output_hash=out_hash,
        calculation_version="3.0.0",
        engine_version="3.0.0",
    )

    state.risk = RiskSection(
        overall_score=raw["overall_score"],
        crisis_level=raw["crisis_level"],
        components=[RiskComponent(**c) for c in raw["components"]],
        trend="escalating" if raw["overall_score"] > 50 else "stable",
        signals=[RiskSignal(**s) for s in raw["signals"]],
        recommendation=raw["recommendation"],
        affected_regions=raw["affected_regions"],
        top_contributors=raw["top_contributors"],
        future_projection=raw.get("future_projection", {}),
        confidence=confidence_score,
        warnings=warnings,
        explanation_metadata=explanation,
        calculation_metadata=calc_meta,
        timestamp=context.timestamp,
    )
    return state
