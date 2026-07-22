"""
GET /api/demo/status & GET /api/demo — Current demo state
POST /api/demo/step & POST /api/demo/next — Advance/set demo step
POST /api/demo/reset — Reset demo to step 0
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState
from app.schemas import DemoState, DemoNextResponse, DemoTimelineStep
from app.core.scenario_engine import get_scenario
from app.routers.audit import create_audit_entry
from app.pipeline.controller import controller
from app.pipeline.models import ExecutionContext

router = APIRouter()


def _get_step_data(scenario_id: str, step: int) -> DemoTimelineStep:
    from app.core.risk_engine import calculate_risk
    scenario = get_scenario(scenario_id or "hormuz_closure")
    dyn_risk = calculate_risk(scenario_id or "hormuz_closure", demo_step=step)["overall_score"]
    if not scenario:
        return DemoTimelineStep(step=0, time="09:00", event="Baseline Operational Mode", type="INFO", risk=dyn_risk)

    timeline = scenario.get("timeline", [])
    if not timeline:
        return DemoTimelineStep(step=0, time="09:00", event="Baseline Operational Mode", type="INFO", risk=dyn_risk)

    idx = min(max(0, step), len(timeline) - 1)
    s = timeline[idx]
    return DemoTimelineStep(step=s["step"], time=s["time"], event=s["event"], type=s["type"], risk=dyn_risk)



def _recalculate_pipeline(db: Session, scenario_id: str, step: int):
    try:
        ctx = ExecutionContext(
            scenario_id=scenario_id or "hormuz_closure",
            demo_step=step,
            trigger="DEMO_STEP",
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        controller.run(context=ctx)
    except Exception as exc:
        print(f"[DEMO PIPELINE] Recalculation note: {exc}")


@router.get("/demo/status", response_model=DemoState)
@router.get("/demo", response_model=DemoState)
def get_demo_state(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1, active_scenario_id="hormuz_closure", demo_step=0, demo_running=False)
        db.add(state)
        db.commit()
        db.refresh(state)

    active_id = state.active_scenario_id or "hormuz_closure"
    scenario = get_scenario(active_id)
    timeline = scenario.get("timeline", []) if scenario else []
    current_step = state.demo_step or 0
    total_steps = max(len(timeline), 1)

    current_event = _get_step_data(active_id, current_step)

    activated_at = state.activated_at
    if activated_at:
        now = datetime.now(timezone.utc)
        act = activated_at.replace(tzinfo=timezone.utc) if activated_at.tzinfo is None else activated_at
        elapsed_seconds = int((now - act).total_seconds())
        elapsed = f"{elapsed_seconds // 60:02d}:{elapsed_seconds % 60:02d}"
    else:
        elapsed = "00:00"

    return DemoState(
        current_step=current_step,
        total_steps=total_steps,
        current_event=current_event,
        scenario_name=scenario["name"] if scenario else "Hormuz Strait Crisis",
        elapsed_time=elapsed,
        is_complete=current_step >= total_steps - 1,
    )


@router.post("/demo/step")
@router.post("/demo/next")
def demo_step(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1, active_scenario_id="hormuz_closure", demo_step=0)
        db.add(state)

    active_id = state.active_scenario_id or "hormuz_closure"
    scenario = get_scenario(active_id)
    timeline = scenario.get("timeline", []) if scenario else []
    total_steps = max(len(timeline), 1)

    target_step = payload.get("step")
    current_step = state.demo_step or 0

    if target_step is not None:
        new_step = max(0, min(int(target_step), total_steps - 1))
    else:
        new_step = min(current_step + 1, total_steps - 1)

    state.demo_step = new_step
    db.commit()

    event = _get_step_data(active_id, new_step)
    is_complete = new_step >= total_steps - 1

    # Recalculate pipeline state based on new step
    _recalculate_pipeline(db, active_id, new_step)

    create_audit_entry(
        db=db,
        user="Operator",
        action=f"Demo Step set to {new_step}: {event.event[:60]}",
        module="Demo Mode",
        event_type="USER",
        details={"step": new_step, "event": event.event},
    )

    return {
        "success": True,
        "current_step": new_step,
        "total_steps": total_steps,
        "event": event,
        "is_complete": is_complete,
        "scenario_name": scenario["name"] if scenario else "Hormuz Strait Crisis",
    }


@router.post("/demo/reset")
def demo_reset(db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    if not state:
        state = ScenarioState(id=1, active_scenario_id="hormuz_closure", demo_step=0)
        db.add(state)

    state.demo_step = 0
    state.demo_running = False
    db.commit()

    _recalculate_pipeline(db, state.active_scenario_id, 0)

    create_audit_entry(
        db=db,
        user="Operator",
        action="Demo Sandbox Reset to Step 0",
        module="Demo Mode",
        event_type="USER",
    )

    return {"success": True, "message": "Demo sandbox state reset to Step 0 successfully.", "current_step": 0}
