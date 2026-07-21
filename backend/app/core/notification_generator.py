"""
Notification Generator — deterministic scenario and state-driven notification engine.
Evaluates state threshold breaches (Risk > 80, SPR < 20%, Compliance Red, Oil Price Spike)
and attaches severity, category, timestamp, and suggested actions.
"""
from typing import Any, List
from app.pipeline.models import Notification

SCENARIO_NOTIFICATIONS = {
    "hormuz_closure": [
        {"id": 1, "time": "09:15", "type": "CRITICAL", "severity": "CRITICAL", "category": "RISK", "title": "Strait of Hormuz tension escalates",
         "detail": "Risk score elevated to 74/100. West Africa procurement recommended.", "suggested_action": "Reroute VLCCs via Cape of Good Hope.", "read": False},
        {"id": 2, "time": "09:30", "type": "WARNING", "severity": "WARNING", "category": "ECONOMIC", "title": "OPEC emergency meeting",
         "detail": "Production cut announcement expected within 6 hours.", "suggested_action": "Prepare spot procurement tenders.", "read": False},
        {"id": 3, "time": "10:00", "type": "INFO", "severity": "INFO", "category": "TIMELINE", "title": "Cargo rerouted successfully",
         "detail": "MV Bharat Star now on Cape of Good Hope route.", "suggested_action": "Track vessel ETA in Maritime module.", "read": True},
        {"id": 4, "time": "10:30", "type": "WARNING", "severity": "WARNING", "category": "ECONOMIC", "title": "Brent crude surge",
         "detail": "Price up $8.4/bbl — now at $96.4/bbl.", "suggested_action": "Review OMC retail subsidy buffer.", "read": True},
        {"id": 5, "time": "10:45", "type": "SUCCESS", "severity": "SUCCESS", "category": "SPR", "title": "SPR drawdown plan ready",
         "detail": "8.5M bbl drawdown plan generated. Awaiting Cabinet approval.", "suggested_action": "Submit Motion MOT-HORMUZ to Cabinet.", "read": True},
    ],
    "opec_cut": [
        {"id": 1, "time": "08:00", "type": "CRITICAL", "severity": "CRITICAL", "category": "RISK", "title": "OPEC+ 2M bbl/day cut confirmed",
         "detail": "90-day production cut effective immediately. Supply gap: 1.8M bbl/day.", "suggested_action": "Issue Brazil & USA term tenders.", "read": False},
        {"id": 2, "time": "09:00", "type": "WARNING", "severity": "WARNING", "category": "ECONOMIC", "title": "Brent at $94.2/bbl",
         "detail": "Crude market in shock — procurement window narrowing.", "suggested_action": "Lock in term contracts.", "read": False},
    ],
    "russia_sanctions": [
        {"id": 1, "time": "06:00", "type": "CRITICAL", "severity": "CRITICAL", "category": "COMPLIANCE", "title": "14 Russian tankers sanctioned",
         "detail": "OFAC SDN expansion — India's Russia crude at 22% exposure.", "suggested_action": "Halt Russian crude tenders.", "read": False},
        {"id": 2, "time": "08:00", "type": "CRITICAL", "severity": "CRITICAL", "category": "COMPLIANCE", "title": "4 shipments blocked by compliance",
         "detail": "Compliance engine halted Russia-origin shipments pending review.", "suggested_action": "Switch to West Africa alternative.", "read": False},
    ],
}

DEFAULT_NOTIFICATIONS = [
    {"id": 1, "time": "09:00", "type": "INFO", "severity": "INFO", "category": "SYSTEM", "title": "System nominal",
     "detail": "All supply chains operating within normal parameters.", "suggested_action": "Continue baseline monitoring.", "read": False},
    {"id": 2, "time": "08:30", "type": "INFO", "severity": "INFO", "category": "SPR", "title": "SPR at 64%",
     "detail": "Strategic reserve above minimum threshold. No action required.", "suggested_action": "Maintain routine maintenance.", "read": True},
]


def execute(state: Any, context: Any) -> Any:
    """
    Execute Notification Generator.
    Evaluates scenario and state metrics to populate state.notifications.
    """
    scenario_id = context.scenario_id
    raw = SCENARIO_NOTIFICATIONS.get(scenario_id, DEFAULT_NOTIFICATIONS).copy()

    # Rule-based dynamic notifications from state flags
    if state.risk.overall_score > 80:
        raw.insert(0, {
            "id": 99,
            "time": "NOW",
            "type": "CRITICAL",
            "severity": "CRITICAL",
            "category": "RISK",
            "title": "THRESHOLD EXCEEDED: Extreme Energy Risk",
            "detail": f"National risk index reached {state.risk.overall_score}/100.",
            "suggested_action": "Convene Cabinet Committee on Security immediately.",
            "read": False,
        })

    state.notifications = [Notification(**n) for n in raw]
    return state
