from typing import Any
from app.core.scenario_engine import get_scenario
from app.core.risk_engine import calculate_risk
from app.pipeline.models import TimelineSection, TimelineEvent

def execute(state: Any, context: Any) -> Any:
    """
    Execute Timeline Engine.
    Resolves scenario timeline events with dynamically calculated step risk scores.
    """
    scenario_id = context.scenario_id
    demo_step = context.demo_step

    if not scenario_id:
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
        state.timeline = TimelineSection(
            scenario_id=None,
            scenario_name=None,
            events=events,
            current_step=demo_step
        )
    else:
        scenario = get_scenario(scenario_id)
        if not scenario:
            state.timeline = TimelineSection(
                scenario_id=scenario_id,
                scenario_name="Unknown",
                events=[],
                current_step=0
            )
        else:
            timeline_events = scenario.get("timeline", [])
            events = [
                TimelineEvent(
                    time=e["time"],
                    event=e["event"],
                    type=e["type"],
                    risk=calculate_risk(scenario_id, demo_step=e["step"])["overall_score"],
                    step=e["step"],
                    is_current=(e["step"] == demo_step)
                )
                for e in timeline_events
            ]
            state.timeline = TimelineSection(
                scenario_id=scenario_id,
                scenario_name=scenario["name"],
                events=events,
                current_step=demo_step
            )
    return state

