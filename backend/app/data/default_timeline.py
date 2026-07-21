"""
Default timeline for when no scenario is active.
"""
DEFAULT_TIMELINE = [
    {"time": "09:00", "event": "Normal operations — Brent $88/bbl", "type": "INFO", "risk": 32},
    {"time": "09:30", "event": "Iranian naval drill announced", "type": "WARNING", "risk": 45},
    {"time": "10:00", "event": "Hormuz tanker traffic reduced 15%", "type": "WARNING", "risk": 58},
    {"time": "10:30", "event": "OPEC emergency meeting called", "type": "CRITICAL", "risk": 67},
    {"time": "11:00", "event": "Brent spikes to $96/bbl", "type": "CRITICAL", "risk": 74},
    {"time": "11:30", "event": "AI recommends West Africa reroute", "type": "AI", "risk": 74},
    {"time": "12:00", "event": "Cabinet briefed — SPR drawdown approved", "type": "ACTION", "risk": 71},
    {"time": "12:30", "event": "Procurement orders placed West Africa", "type": "ACTION", "risk": 65},
    {"time": "13:00", "event": "Situation stabilizing — risk dropping", "type": "INFO", "risk": 58},
]
