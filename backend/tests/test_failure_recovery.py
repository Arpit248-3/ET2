"""
Failure Recovery and Safe Mode Tests for Aegis Orchestrator.
Verifies graceful degradation to deterministic bounded analysis,
safe handling of tool failures, and rejection of invalid tool inputs.
"""
import pytest
from app.ai.orchestrator import aegis_orchestrator
from app.ai.tools.registry import aegis_tools, ToolContract, ToolExecutionResult
from pydantic import BaseModel, Field


class FlakyInput(BaseModel):
    should_fail: bool = Field(False)


@pytest.mark.anyio
async def test_tool_failure_recovery():
    """Verify that a failing tool logs an error in its execution result without crashing the orchestrator."""
    async def failing_executor(should_fail: bool):
        if should_fail:
            raise RuntimeError("Upstream satellite telemetry link offline.")
        return {"status": "ok"}

    flaky_tool = ToolContract(
        name="test_flaky_telemetry",
        description="Failing telemetry tool for recovery test",
        parameters_schema=FlakyInput,
        risk_level="LOW",
        requires_approval=False,
        executor=failing_executor,
        timeout_seconds=5,
    )

    aegis_tools.register(flaky_tool)

    # 1. Successful call
    res_ok = await flaky_tool.execute({"should_fail": False})
    assert res_ok.status == "SUCCESS"

    # 2. Failing call must return status FAILED and record error message
    res_fail = await flaky_tool.execute({"should_fail": True})
    assert res_fail.status == "FAILED"
    assert "satellite telemetry link offline" in res_fail.error
    assert res_fail.latency_ms >= 0


@pytest.mark.anyio
async def test_safe_mode_deterministic_execution():
    """Verify that missions execute with deterministic grounding even when external LLM APIs are absent."""
    # Run mission in pure deterministic engine mode
    res = await aegis_orchestrator.run_mission(
        mission="Stabilize supply quickly while preserving SPR",
        scenario_id="hormuz_closure",
        user_id="safe_mode_test"
    )

    assert res["id"] is not None
    assert res["status"] in ("AWAITING_APPROVAL", "COMPLETED")
    assert res["plan_v1"] is not None
    assert len(res["steps"]) > 0

    # Ensure all step outputs originate from registered deterministic engines
    tool_steps = [s for s in res["steps"] if s["action"] == "TOOL_CALL"]
    assert len(tool_steps) >= 5
    for ts in tool_steps:
        assert ts["tool_name"] in aegis_tools._tools
        assert ts["status"] == "SUCCESS"


@pytest.mark.anyio
async def test_malformed_tool_input_validation():
    """Verify that invalid types or missing required arguments return clean validation errors."""
    tool = aegis_tools.get("optimize_procurement")
    # Missing scenario_id and invalid priority type
    res = await tool.execute({"priority": 12345})
    assert res.status == "FAILED"
    assert "Invalid arguments" in res.error
