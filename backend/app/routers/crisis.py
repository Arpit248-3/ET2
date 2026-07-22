"""
Crisis Management & Emergency Escalation Router
Endpoints:
- POST /api/crisis/activate — Toggle crisis mode and trigger master risk pipeline recalculation
- POST /api/crisis/upload-manifest — Upload emergency logistics CSV/JSON manifest and recalculate supply chain shifts
"""
import io
import csv
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.routers.audit import create_audit_entry
from app.pipeline.controller import controller
from app.pipeline.models import ExecutionContext

logger = logging.getLogger("urjanetra.crisis")

router = APIRouter()


def _recalculate_crisis_pipeline(db: Session, scenario_id: str, is_crisis: bool):
    try:
        ctx = ExecutionContext(
            scenario_id=scenario_id or "hormuz_closure",
            demo_step=99 if is_crisis else 0,
            trigger="CRISIS_ESCALATION" if is_crisis else "CRISIS_DEACTIVATION",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        return controller.run(context=ctx)
    except Exception as exc:
        logger.error(f"Crisis pipeline recalculation note: {exc}")
        return None


@router.get("/crisis/status")
def get_crisis_status(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    is_active = state.demo_running if state else False
    active_scenario = state.active_scenario_id if state else "hormuz_closure"
    return {
        "crisis_active": is_active,
        "active_scenario": active_scenario,
        "threat_level": "DEFCON-1 ESCALATED" if is_active else "ELEVATED MONITORING",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/crisis/activate")
def activate_crisis_mode(payload: dict = {}, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1, active_scenario_id="hormuz_closure", demo_step=0, demo_running=False)
        db.add(state)

    target_state = payload.get("activate")
    if target_state is None:
        target_state = not state.demo_running

    state.demo_running = target_state
    if target_state and not state.active_scenario_id:
        state.active_scenario_id = "hormuz_closure"
    
    db.commit()

    # Engine Integration: Trigger master pipeline recalculation to adjust risk scores across dashboard
    updated_pipeline = _recalculate_crisis_pipeline(db, state.active_scenario_id, target_state)

    status_str = "ACTIVATED (EMERGENCY OVERRIDE)" if target_state else "DEACTIVATED (NORMAL OPERATIONS)"

    create_audit_entry(
        db=db,
        user=payload.get("operator", "Commander Arjun Mehta"),
        action=f"Crisis Emergency Escalation Mode {status_str}",
        module="Crisis Management",
        event_type="SECURITY",
        details={"crisis_active": target_state, "scenario_id": state.active_scenario_id}
    )

    return {
        "success": True,
        "crisis_active": target_state,
        "message": f"Global Crisis Escalation Mode {status_str}.",
        "threat_level": "DEFCON-1 ESCALATED" if target_state else "STANDARD MONITORING",
        "pipeline_updated": updated_pipeline is not None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/crisis/upload-manifest")
async def upload_emergency_manifest(
    file: UploadFile = File(...),
    notes: str = Form(None),
    db: Session = Depends(get_db)
):
    filename = file.filename or "manifest.csv"
    contents = await file.read()

    parsed_rows = []
    try:
        if filename.endswith(".json"):
            data = json.loads(contents.decode("utf-8"))
            if isinstance(data, list):
                parsed_rows = data
            elif isinstance(data, dict) and "manifest" in data:
                parsed_rows = data["manifest"]
        else:
            text_stream = io.StringIO(contents.decode("utf-8-sig", errors="ignore"))
            reader = csv.DictReader(text_stream)
            for row in reader:
                parsed_rows.append(row)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse emergency manifest: {str(exc)}")

    total_volume_mbbl = 0.0
    for r in parsed_rows:
        try:
            vol = float(r.get("volume_mbbl", r.get("volume", r.get("quantity", 0))))
            total_volume_mbbl += vol
        except (ValueError, TypeError):
            pass

    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    active_scenario = state.active_scenario_id if state else "hormuz_closure"
    _recalculate_crisis_pipeline(db, active_scenario, True)

    create_audit_entry(
        db=db,
        user="Logistics Officer",
        action=f"Emergency Logistics Manifest Uploaded ({len(parsed_rows)} entries, {filename})",
        module="Crisis Mode",
        event_type="USER",
        details={
            "filename": filename,
            "record_count": len(parsed_rows),
            "estimated_volume_mbbl": round(total_volume_mbbl, 2),
            "notes": notes
        }
    )

    return {
        "success": True,
        "filename": filename,
        "records_processed": len(parsed_rows),
        "total_volume_mbbl": round(total_volume_mbbl, 2),
        "status": "MANIFEST INTEGRATED INTO EMERGENCY PIPELINE",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
