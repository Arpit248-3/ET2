"""
Contract and Schema Validation Tests for Aegis Tool Registry.
Verifies that all tools invoke deterministic engines and reject untrusted/malformed inputs.
"""
import pytest
import asyncio
from app.ai.tools.registry import aegis_tools, ToolContract, ToolExecutionResult


@pytest.mark.anyio
async def test_tool_registry_catalog_completeness():
    """Verify all 15 sovereign tools are registered with schemas and metadata."""
    assert len(aegis_tools) == 15
    tools = aegis_tools.list_tools()
    tool_names = [t["name"] for t in tools]

    expected_tools = [
        "get_active_scenario",
        "get_scenario_context",
        "get_risk_assessment",
        "get_supply_gap",
        "calculate_economic_impact",
        "optimize_procurement",
        "create_spr_plan",
        "validate_compliance",
        "run_red_team",
        "generate_action_brief",
        "create_decision",
        "request_human_approval",
        "write_audit_event",
        "get_previous_agent_steps",
        "get_policy_thresholds",
    ]

    for et in expected_tools:
        assert et in tool_names, f"Missing tool: {et}"
        tool = aegis_tools.get(et)
        assert tool is not None
        assert tool.parameters_schema is not None
        assert tool.risk_level in ("LOW", "MEDIUM", "HIGH", "CRITICAL")


@pytest.mark.anyio
async def test_deterministic_engine_invocation_risk():
    """Verify get_risk_assessment invokes the deterministic risk engine and returns real numerical data."""
    tool = aegis_tools.get("get_risk_assessment")
    res: ToolExecutionResult = await tool.execute({"scenario_id": "hormuz_closure"})

    assert res.status == "SUCCESS"
    assert res.error is None
    assert isinstance(res.output, dict)
    assert "overall_score" in res.output
    assert res.output["overall_score"] >= 0
    assert "provenance" in res.output or res.provenance is not None


@pytest.mark.anyio
async def test_deterministic_engine_invocation_procurement():
    """Verify optimize_procurement invokes the deterministic procurement engine."""
    tool = aegis_tools.get("optimize_procurement")
    res: ToolExecutionResult = await tool.execute({
        "scenario_id": "hormuz_closure",
        "priority": "speed"
    })

    assert res.status == "SUCCESS"
    assert "recommended_mix" in res.output
    assert len(res.output["recommended_mix"]) > 0
    # Speed priority selects UAE
    assert res.output["recommended_mix"][0]["name"] == "UAE (ADNOC / Murban)"


@pytest.mark.anyio
async def test_tool_input_schema_validation_rejection():
    """Verify tool rejects malformed or invalid inputs with validation error."""
    tool = aegis_tools.get("create_spr_plan")
    # Missing required 'daily_gap_mbbl' or passing invalid type
    res: ToolExecutionResult = await tool.execute({
        "daily_gap_mbbl": "invalid_number",
        "days_until_cargo": 10
    })

    assert res.status == "FAILED"
    assert "Invalid arguments" in res.error


@pytest.mark.anyio
async def test_unregistered_tool_execution_rejection():
    """Verify attempt to execute an arbitrary/unregistered tool name is cleanly rejected."""
    res: ToolExecutionResult = await aegis_tools.execute_by_name(
        "arbitrary_python_executor",
        {"code": "import os; os.system('calc')"}
    )
    assert res.status == "FAILED"
    assert "not registered in the Aegis sovereign tool catalog" in res.error
