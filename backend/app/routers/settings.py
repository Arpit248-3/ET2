"""
GET /api/settings/thresholds — Read current threshold config
PUT /api/settings/thresholds — Update threshold config
"""
import json
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ThresholdConfig
from app.schemas import ThresholdUpdateRequest
from app.core.scenario_engine import get_thresholds, invalidate_reference_cache
from app.routers.audit import create_audit_entry

router = APIRouter()

THRESHOLDS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "reference", "thresholds.json"
)


@router.get("/settings/thresholds")
def get_threshold_settings(db: Session = Depends(get_db)):
    thresholds = get_thresholds()
    return {"thresholds": thresholds, "timestamp": datetime.now(timezone.utc).isoformat()}


@router.put("/settings/thresholds")
def update_threshold_settings(request: ThresholdUpdateRequest, db: Session = Depends(get_db)):
    # Merge with existing
    existing = get_thresholds()

    def deep_merge(base: dict, update: dict) -> dict:
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                deep_merge(base[key], value)
            else:
                base[key] = value
        return base

    merged = deep_merge(existing, request.thresholds)

    # Write back to JSON file (persistence)
    with open(THRESHOLDS_PATH, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2)

    # Invalidate cache
    invalidate_reference_cache()

    create_audit_entry(
        db=db,
        user=request.updated_by,
        action="Thresholds Updated",
        module="Settings",
        event_type="USER",
        details={"updated_keys": list(request.thresholds.keys())},
    )

    return {
        "success": True,
        "thresholds": merged,
        "updated_by": request.updated_by,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
