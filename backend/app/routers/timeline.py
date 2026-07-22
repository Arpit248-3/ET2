"""
GET /api/timeline — Returns the full scenario timeline with current step marker
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ScenarioState
from app.schemas import TimelineResponse, TimelineEvent
from app.core.scenario_engine import get_scenario

router = APIRouter()


@router.get("/timeline", response_model=TimelineResponse)
def get_timeline(db: Session = Depends(get_db)):
    from app.core.risk_engine import calculate_risk
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = state.active_scenario_id if state else None
    demo_step = state.demo_step if state else 0

    if not scenario_id:
        # Return default baseline timeline
        from app.data.default_timeline import DEFAULT_TIMELINE
        events = [
            TimelineEvent(
                time=e["time"],
                event=e["event"],
                type=e["type"],
                risk=calculate_risk(None, demo_step=i)["overall_score"],
                step=i,
                is_current=(i == demo_step)
            )
            for i, e in enumerate(DEFAULT_TIMELINE)
        ]
        return TimelineResponse(scenario_id=None, scenario_name=None, events=events, current_step=demo_step)

    scenario = get_scenario(scenario_id)
    if not scenario:
        return TimelineResponse(scenario_id=scenario_id, scenario_name="Unknown", events=[], current_step=0)

    timeline = scenario.get("timeline", [])
    events = [
        TimelineEvent(
            time=e["time"],
            event=e["event"],
            type=e["type"],
            risk=calculate_risk(scenario_id, demo_step=e["step"])["overall_score"],
            step=e["step"],
            is_current=(e["step"] == demo_step),
        )
        for e in timeline
    ]

    return TimelineResponse(
        scenario_id=scenario_id,
        scenario_name=scenario["name"],
        events=events,
        current_step=demo_step,
    )

