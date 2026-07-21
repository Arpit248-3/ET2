"""
GET /api/notifications — Returns notifications based on active scenario
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import NotificationsResponse, Notification
from app.core.scenario_engine import get_scenario

router = APIRouter()

SCENARIO_NOTIFICATIONS = {
    "hormuz_closure": [
        {"id": 1, "time": "09:15", "type": "CRITICAL", "title": "Hormuz tension escalates", "detail": "Risk score elevated to 74/100. West Africa procurement recommended.", "read": False},
        {"id": 2, "time": "09:30", "type": "WARNING", "title": "OPEC emergency meeting", "detail": "Production cut announcement expected within 6 hours.", "read": False},
        {"id": 3, "time": "10:00", "type": "INFO", "title": "Cargo rerouted successfully", "detail": "MV Bharat Star now on Cape of Good Hope route.", "read": True},
        {"id": 4, "time": "10:30", "type": "WARNING", "title": "Brent crude surge", "detail": "Price up $8.4/bbl — now at $96.4/bbl.", "read": True},
        {"id": 5, "time": "10:45", "type": "SUCCESS", "title": "SPR drawdown plan ready", "detail": "8.5M bbl drawdown plan generated. Awaiting Cabinet approval.", "read": True},
    ],
    "opec_cut": [
        {"id": 1, "time": "08:00", "type": "CRITICAL", "title": "OPEC+ 2M bbl/day cut confirmed", "detail": "90-day production cut effective immediately. Supply gap: 1.8M bbl/day.", "read": False},
        {"id": 2, "time": "09:00", "type": "WARNING", "title": "Brent at $94.2/bbl", "detail": "Crude market in shock — procurement window narrowing.", "read": False},
        {"id": 3, "time": "10:00", "type": "INFO", "title": "Brazil LOI being drafted", "detail": "Petrobras contact initiated for emergency term supply.", "read": True},
    ],
    "russia_sanctions": [
        {"id": 1, "time": "06:00", "type": "CRITICAL", "title": "14 Russian tankers sanctioned", "detail": "OFAC SDN expansion — India's Russia crude at 22% exposure.", "read": False},
        {"id": 2, "time": "08:00", "type": "CRITICAL", "title": "4 shipments blocked by compliance", "detail": "Compliance engine halted Russia-origin shipments pending review.", "read": False},
        {"id": 3, "time": "09:00", "type": "WARNING", "title": "Shadow fleet detected", "detail": "22 unidentified VLCCs detected in India EEZ — identity unclear.", "read": False},
    ],
    "port_disruption": [
        {"id": 1, "time": "06:00", "type": "CRITICAL", "title": "Vadinar port closed — cyclone", "detail": "Category 4 cyclone direct hit. All operations suspended.", "read": False},
        {"id": 2, "time": "09:00", "type": "WARNING", "title": "Paradip strike — 48hr shutdown", "detail": "2 cargo deliveries delayed. Arbitration underway.", "read": False},
        {"id": 3, "time": "14:00", "type": "INFO", "title": "VLCCs redirected to Vizag", "detail": "3 tankers successfully rerouted. ETA 2 days.", "read": True},
    ],
}

DEFAULT_NOTIFICATIONS = [
    {"id": 1, "time": "09:00", "type": "INFO", "title": "System nominal", "detail": "All supply chains operating within normal parameters.", "read": False},
    {"id": 2, "time": "08:30", "type": "INFO", "title": "SPR at 64%", "detail": "Strategic reserve above minimum threshold. No action required.", "read": True},
    {"id": 3, "time": "08:00", "type": "INFO", "title": "Brent stable $88/bbl", "detail": "No significant price movement in past 24 hours.", "read": True},
]


@router.get("/notifications", response_model=NotificationsResponse)
def get_notifications(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None

    raw = SCENARIO_NOTIFICATIONS.get(scenario_id, DEFAULT_NOTIFICATIONS)
    notifications = [Notification(**n) for n in raw]
    unread = sum(1 for n in notifications if not n.read)

    return NotificationsResponse(notifications=notifications, unread_count=unread)


@router.post("/notifications/mark-read")
def mark_notifications_read(payload: dict = {}, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None

    raw = SCENARIO_NOTIFICATIONS.get(scenario_id, DEFAULT_NOTIFICATIONS)
    notif_id = payload.get("id")

    for n in raw:
        if notif_id is None or n["id"] == notif_id or notif_id == "all":
            n["read"] = True

    notifications = [Notification(**n) for n in raw]
    unread = sum(1 for n in notifications if not n.read)
    return {"success": True, "unread_count": unread, "notifications": notifications}


@router.post("/notifications/preferences")
def update_notification_preferences(payload: dict, db: Session = Depends(get_db)):
    # Save preferences to DB / memory state
    return {
        "success": True,
        "message": "Notification preferences updated successfully",
        "preferences": payload,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

