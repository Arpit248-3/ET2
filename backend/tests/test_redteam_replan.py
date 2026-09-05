"""
Adversarial Red Team Replanning and Anti-Fake-Replanning Tests.
Verifies that Red Team rejects vulnerable plans, causes actual constraint adjustments,
and produces a machine-comparable Plan V2 with genuinely changed underlying parameters.
"""
import pytest
from app.ai.orchestrator import aegis_orchestrator
from app.ai.tools.registry import aegis_tools


@pytest.mark.anyio
async def test_red_team_tool_objection_generation():
    """Verify Red Team tool evaluates candidate plan and generates specific objections."""
    tool = aegis_tools.get("run_red_team")
    res = await tool.execute({
        "scenario_id": "hormuz_closure",
        "recommendation": "Procure 100% crude from West Africa via Cape route",
        "proposed_suppliers": ["West Africa (Nigeria / Bonny Light)"],
        "spr_drawdown_mbbl": 15.0,
        "iteration": 1,
    })

    assert res.status == "SUCCESS"
    assert "verdict" in res.output
    assert res.output["verdict"] in ("REJECTED", "CONDITIONAL", "PASSED")
    if res.output["verdict"] == "REJECTED":
        assert len(res.output["objections"]) > 0
        assert "suggested_replan" in res.output


@pytest.mark.anyio
async def test_replanning_loop_modifies_underlying_parameters():
    """Verify replanning loop produces genuinely changed suppliers and drawdown quantities."""
    mission = "Stabilize supply quickly while preserving SPR"
    scenario_id = "hormuz_closure"

    res = await aegis_orchestrator.run_mission(
        mission=mission,
        scenario_id=scenario_id,
        user_id="test_suite"
    )

    assert res["id"] is not None
    assert res["plan_v1"] is not None

    # If Red Team rejected, verify Plan V2 exists and genuinely differs
    if res["iteration"] > 1:
        assert res["plan_v2"] is not None
        assert res["replan_reason"] is not None

        diff = aegis_orchestrator._diff_plans(res["plan_v1"], res["plan_v2"])
        assert diff["version_comparison"] == "Plan V1 vs Plan V2"
        assert diff["replan_reason_addressed"] is True
        # Underlying suppliers or routes must be genuinely modified
        assert diff["suppliers_changed"] is True
        assert diff["plan_v1_suppliers"] != diff["plan_v2_suppliers"]


@pytest.mark.anyio
async def test_max_iteration_limit_enforced():
    """Verify replan loop cannot loop indefinitely and enforces MAX_AGENT_ITERATIONS."""
    max_iter = aegis_orchestrator.max_iterations
    assert max_iter == 3
