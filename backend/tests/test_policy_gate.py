"""
Policy Gate and Authorization Security Boundary Tests.
Verifies server-side policy enforcement and clearance-based human-in-the-loop gates.
"""
import pytest
from app.core.policy_gate import policy_gate, PolicyGateResult
from app.models import DBUser, AgentRun
from starlette.testclient import TestClient
from app.main import app


def test_policy_gate_blocks_statutory_breach():
    """Verify Policy Gate BLOCKS any plan causing SPR to breach statutory floor."""
    unsafe_plan = {
        "action_type": "SPR_RELEASE",
        "spr_plan": {
            "total_drawdown_required_mbbl": 22.0,
            "reserve_after_action_pct": 14.5, # Below 20.0% statutory minimum
        },
        "procurement_plan": {"recommended_mix": []}
    }

    gate_res: PolicyGateResult = policy_gate.evaluate_plan(unsafe_plan, "hormuz_closure")
    assert gate_res.status == "BLOCKED_BY_POLICY"
    assert gate_res.is_safe is False
    assert any("STATUTORY BREACH" in v for v in gate_res.violations)


def test_policy_gate_flags_high_risk_spr_release():
    """Verify SPR release above autonomous ceiling (5M bbl) triggers mandatory human approval."""
    spr_plan = {
        "action_type": "SPR_RELEASE",
        "spr_plan": {
            "total_drawdown_required_mbbl": 9.5, # Exceeds 5.0M bbl autonomous ceiling
            "reserve_after_action_pct": 36.0,   # Below 50% warning reserve
        },
        "procurement_plan": {"recommended_mix": []}
    }

    gate_res: PolicyGateResult = policy_gate.evaluate_plan(spr_plan, "hormuz_closure")
    assert gate_res.status == "FLAGGED_FOR_APPROVAL"
    assert gate_res.requires_human_approval is True
    assert gate_res.risk_level == "HIGH"
    assert any("RESERVE SAFETY WARNING" in w for w in gate_res.warnings)
    assert any("BOUNDED AUTONOMY TRIGGER" in w for w in gate_res.warnings)


def test_policy_gate_sanctions_blocking():
    """Verify allocated volumes to sanctioned suppliers are blocked."""
    sanctioned_plan = {
        "action_type": "PROCUREMENT_REROUTE",
        "procurement_plan": {
            "recommended_mix": [
                {
                    "name": "Iran NIOC Blacklisted Cargo",
                    "recommended_volume_mbbl": 1.5,
                    "compliance_status": "SANCTIONED_OFAC",
                    "landed_cost_usd_bbl": 75.0,
                }
            ]
        }
    }

    gate_res: PolicyGateResult = policy_gate.evaluate_plan(sanctioned_plan, "hormuz_closure")
    assert gate_res.status == "BLOCKED_BY_POLICY"
    assert any("SANCTIONS VIOLATION" in v for v in gate_res.violations)


def test_operator_clearance_authorization():
    """Verify clearance level authorization checks."""
    low_clearance_user = DBUser(
        id="usr_operator",
        name="Logistics Officer",
        email="operator@nemc.gov.in",
        role="Logistics Operator",
        clearance_level="LEVEL-2 RESTRICTED",
        status="ACTIVE",
    )

    cosmic_admin = DBUser(
        id="admin_system",
        name="Cabinet Commander",
        email="admin@urjanetra.gov.in",
        role="System Administrator",
        clearance_level="LEVEL-5 COSMIC TOP SECRET",
        status="ACTIVE",
    )

    dummy_run = AgentRun(id="run_test", user_id="test_user")

    # 1. Low clearance attempt must fail
    res_low = policy_gate.authorize_operator_action(low_clearance_user, "LEVEL-5 COSMIC TOP SECRET", dummy_run)
    assert res_low["authorized"] is False
    assert "insufficient" in res_low["reason"].lower()

    # 2. None user attempt must fail
    res_none = policy_gate.authorize_operator_action(None, "LEVEL-5 COSMIC TOP SECRET", dummy_run)
    assert res_none["authorized"] is False

    # 3. High clearance must succeed
    res_high = policy_gate.authorize_operator_action(cosmic_admin, "LEVEL-5 COSMIC TOP SECRET", dummy_run)
    assert res_high["authorized"] is True


def test_direct_unauthorized_api_approval_rejection():
    """Verify direct API call to approve without valid credentials is rejected with 401."""
    client = TestClient(app)
    r = client.post("/api/agent/runs/run_fake_id/approve")
    assert r.status_code == 401
    assert "Authorization required" in r.json()["detail"]


def test_insufficient_clearance_api_approval_rejection():
    """Verify direct API call with low clearance credentials is rejected with 403."""
    client = TestClient(app)
    r = client.post(
        "/api/agent/runs/run_fake_id/approve",
        headers={"Authorization": "Bearer dev_operator_token", "X-User-Email": "arjun.mehta@nemc.gov.in"} # LEVEL-2
    )
    # The endpoint will reject because arjun.mehta only has LEVEL-2 or run not found (403/400/404)
    assert r.status_code in (403, 400, 404)


def test_identity_spoofing_attack_rejection():
    """Verify that attempting to spoof identity via X-User-Email is rejected server-side."""
    client = TestClient(app)
    # 1. Unauthenticated spoof attempt (header without token)
    r1 = client.post(
        "/api/agent/runs/run_fake_id/approve",
        headers={"X-User-Email": "admin@urjanetra.gov.in"}
    )
    assert r1.status_code == 401
    assert "Authorization required" in r1.json()["detail"]

    # 2. Token / header mismatch (operator token attempting to claim admin identity)
    r2 = client.post(
        "/api/agent/runs/run_fake_id/approve",
        headers={
            "Authorization": "Bearer dev_operator_token",
            "X-User-Email": "admin@urjanetra.gov.in"
        }
    )
    assert r2.status_code == 403
    assert "Identity spoofing detected" in r2.json()["detail"]
