"""
Mission Objective Variation Tests.
Verifies that varying the mission objective (Speed vs SPR-Preservation vs Cost)
measurably changes the agent's optimization weights, candidate suppliers, and operational parameters.
"""
import pytest
from app.ai.orchestrator import aegis_orchestrator


@pytest.mark.anyio
async def test_multi_mission_objective_differentiation():
    """Verify Speed-first, SPR-preservation, and Cost-first produce measurably different plans."""
    scenario = "hormuz_closure"

    # Mission 1: Speed First
    res_speed = await aegis_orchestrator.run_mission(
        mission="Stabilize supply as quickly as possible. Urgent delivery required.",
        scenario_id=scenario,
        user_id="test_runner"
    )

    # Mission 2: SPR Preservation First
    res_spr = await aegis_orchestrator.run_mission(
        mission="Minimize SPR depletion. Preserve strategic petroleum reserves at all costs.",
        scenario_id=scenario,
        user_id="test_runner"
    )

    # Mission 3: Cost First
    res_cost = await aegis_orchestrator.run_mission(
        mission="Lowest landed price first. Minimize crude cost above all else.",
        scenario_id=scenario,
        user_id="test_runner"
    )

    # 1. Verify priority weights differ
    w_speed = res_speed["priority_weights"]
    w_spr = res_spr["priority_weights"]
    w_cost = res_cost["priority_weights"]

    assert w_speed["eta"] > w_cost["eta"], "Speed mission should weight ETA higher than cost mission"
    assert w_cost["price"] > w_speed["price"], "Cost mission should weight price higher than speed mission"

    # 2. Verify Plan V1 procurement parameters differ
    p1_speed = res_speed["plan_v1"]["procurement_plan"]["recommended_mix"]
    p1_spr = res_spr["plan_v1"]["procurement_plan"]["recommended_mix"]
    p1_cost = res_cost["plan_v1"]["procurement_plan"]["recommended_mix"]

    speed_top_sup = p1_speed[0]["name"]
    spr_top_sup = p1_spr[0]["name"]
    cost_top_sup = p1_cost[0]["name"]

    # Speed selects UAE (16d ETA vs 28d for Russia)
    assert speed_top_sup == "UAE (ADNOC / Murban)"
    assert p1_speed[0]["eta_days"] < p1_cost[0]["eta_days"]

    # Cost selects Russia (Lowest landed price $80.3/bbl)
    assert cost_top_sup == "Russia (Rosneft / Urals)"
    assert p1_cost[0]["landed_cost_usd_bbl"] < p1_speed[0]["landed_cost_usd_bbl"]

    # SPR mission emphasizes alternate routes
    assert spr_top_sup != speed_top_sup
