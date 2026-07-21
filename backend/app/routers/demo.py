"""
GET /api/demo — Current demo state
POST /api/demo/next — Advance demo one step
POST /api/demo/reset — Reset demo to step 0
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import DemoState, DemoNextResponse, DemoTimelineStep
from app.core.scenario_engine import get_scenario
from app.routers.audit import create_audit_entry

router = APIRouter()


def _get_step_data(scenario_id: str, step: int) -> DemoTimelineStep:
    scenario = get_scenario(scenario_id)
    if not scenario:
        return DemoTimelineStep(step=0, time="09:00", event="No scenario active", type="INFO", risk=32)

    timeline = scenario.get("timeline", [])
    idx = min(step, len(timeline) - 1)
    s = timeline[idx]
    return DemoTimelineStep(step=s["step"], time=s["time"], event=s["event"], type=s["type"], risk=s["risk"])


@router.get("/demo", response_model=DemoState)
def get_demo_state(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state or not state.active_scenario_id:
        return DemoState(
            current_step=0,
            total_steps=0,
            current_event=DemoTimelineStep(step=0, time="09:00", event="No active scenario. Activate one to start demo.", type="INFO", risk=32),
            scenario_name="No Active Scenario",
            elapsed_time="00:00",
            is_complete=False,
        )

    scenario = get_scenario(state.active_scenario_id)
    timeline = scenario.get("timeline", []) if scenario else []
    current_step = state.demo_step or 0
    total_steps = len(timeline)

    current_event = _get_step_data(state.active_scenario_id, current_step)

    activated_at = state.activated_at
    if activated_at:
        elapsed_seconds = int((datetime.now(timezone.utc) - activated_at.replace(tzinfo=timezone.utc) if activated_at.tzinfo is None else datetime.now(timezone.utc) - activated_at).total_seconds())
        elapsed = f"{elapsed_seconds // 60:02d}:{elapsed_seconds % 60:02d}"
    else:
        elapsed = "00:00"

    return DemoState(
        current_step=current_step,
        total_steps=total_steps,
        current_event=current_event,
        scenario_name=scenario["name"] if scenario else "Unknown",
        elapsed_time=elapsed,
        is_complete=current_step >= total_steps - 1,
    )


@router.post("/demo/next", response_model=DemoNextResponse)
def demo_next(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1)
        db.add(state)

    scenario_id = state.active_scenario_id
    if not scenario_id:
        return DemoNextResponse(
            success=False,
            current_step=0,
            total_steps=0,
            event=DemoTimelineStep(step=0, time="--:--", event="No scenario active", type="INFO", risk=0),
            is_complete=False,
        )

    scenario = get_scenario(scenario_id)
    timeline = scenario.get("timeline", []) if scenario else []
    total_steps = len(timeline)

    current_step = state.demo_step or 0
    if current_step < total_steps - 1:
        current_step += 1

    state.demo_step = current_step
    db.commit()

    event = _get_step_data(scenario_id, current_step)
    is_complete = current_step >= total_steps - 1

    create_audit_entry(
        db=db,
        user="Demo System",
        action=f"Demo Advanced to Step {current_step}: {event.event[:60]}",
        module="Demo Mode",
        event_type="SYSTEM",
        details={"step": current_step, "event": event.event},
    )

    return DemoNextResponse(
        success=True,
        current_step=current_step,
        total_steps=total_steps,
        event=event,
        is_complete=is_complete,
    )


@router.post("/demo/reset")
def demo_reset(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1)
        db.add(state)

    state.demo_step = 0
    db.commit()

    create_audit_entry(
        db=db,
        user="Operator",
        action="Demo Reset to Step 0",
        module="Demo Mode",
        event_type="USER",
    )

    return {"success": True, "message": "Demo reset to step 0.", "current_step": 0}


@router.post("/demo/step/{step_idx}")
def demo_step(step_idx: int, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1)
        db.add(state)

    scenario_id = state.active_scenario_id
    if not scenario_id:
        return {"success": False, "message": "No active scenario."}

    scenario = get_scenario(scenario_id)
    timeline = scenario.get("timeline", []) if scenario else []
    total_steps = len(timeline)

    # constrain step_idx
    step_idx = max(0, min(step_idx, total_steps - 1))

    state.demo_step = step_idx
    db.commit()

    event = _get_step_data(scenario_id, step_idx)
    is_complete = step_idx >= total_steps - 1

    create_audit_entry(
        db=db,
        user="Operator",
        action=f"Demo Set to Step {step_idx}: {event.event[:60]}",
        module="Demo Mode",
        event_type="USER",
        details={"step": step_idx, "event": event.event},
    )

    return {
        "success": True,
        "current_step": step_idx,
        "total_steps": total_steps,
        "event": event,
        "is_complete": is_complete,
    }

