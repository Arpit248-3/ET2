"""
GET /api/settings — Retrieve dynamic system settings from SQLAlchemy DB
PUT /api/settings — Save dynamic system settings to SQLAlchemy DB
GET /api/settings/thresholds — Read current threshold config
PUT /api/settings/thresholds — Update threshold config
"""
import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ThresholdConfig
from app.schemas import ThresholdUpdateRequest
from app.core.scenario_engine import get_thresholds, invalidate_reference_cache
from app.routers.audit import create_audit_entry

router = APIRouter()

DEFAULT_SETTINGS = {
    "risk_tolerance": "MEDIUM",
    "ai_model": "gemini-3.6-flash",
    "alert_notifications": True,
    "crisis_auto_trigger": False,
    "spr_reserve_buffer_pct": 20.0,
    "thresholds": get_thresholds()
}


def _get_or_create_config(db: Session) -> ThresholdConfig:
    config_obj = db.query(ThresholdConfig).filter(ThresholdConfig.id == 1).first()
    if not config_obj:
        config_obj = ThresholdConfig(id=1, config=DEFAULT_SETTINGS, updated_by="System")
        db.add(config_obj)
        db.commit()
        db.refresh(config_obj)
    return config_obj


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    config_obj = _get_or_create_config(db)
    return {
        "success": True,
        "settings": config_obj.config,
        "updated_at": config_obj.updated_at.isoformat() if config_obj.updated_at else datetime.now(timezone.utc).isoformat(),
        "updated_by": config_obj.updated_by or "System"
    }


@router.put("/settings")
def update_settings(payload: dict, db: Session = Depends(get_db)):
    config_obj = _get_or_create_config(db)
    current = dict(config_obj.config) if config_obj.config else dict(DEFAULT_SETTINGS)

    # Merge incoming settings payload into stored dict
    for k, v in payload.items():
        if k != "id":
            current[k] = v

    config_obj.config = current
    config_obj.updated_by = payload.get("updated_by", "Operator Arjun Mehta")
    config_obj.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(config_obj)

    # Sync reference threshold file if thresholds sub-dict present
    if "thresholds" in payload:
        try:
            path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "reference", "thresholds.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload["thresholds"], f, indent=2)
            invalidate_reference_cache()
        except Exception:
            pass

    create_audit_entry(
        db=db,
        user=config_obj.updated_by,
        action="System Configuration & Thresholds Saved to DB",
        module="Settings",
        event_type="USER",
        details={"updated_fields": list(payload.keys())}
    )

    return {
        "success": True,
        "message": "System settings persisted to database successfully.",
        "settings": config_obj.config,
        "updated_by": config_obj.updated_by,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/settings/thresholds")
def get_threshold_settings(db: Session = Depends(get_db)):
    config_obj = _get_or_create_config(db)
    thresholds = config_obj.config.get("thresholds", get_thresholds())
    return {"thresholds": thresholds, "timestamp": datetime.now(timezone.utc).isoformat()}


@router.put("/settings/thresholds")
def update_threshold_settings(request: ThresholdUpdateRequest, db: Session = Depends(get_db)):
    return update_settings({"thresholds": request.thresholds, "updated_by": request.updated_by}, db)
