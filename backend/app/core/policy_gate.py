"""
Sovereign Policy Gate & Authorization Engine for Aegis / UrjaNetra AI.
Enforces statutory reserve minimums, sanctions prohibitions, landed-cost ceilings,
bounded autonomy limits, and operator clearance checks.
"""
from __future__ import annotations

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.core import scenario_engine
from app.models import DBUser, AgentRun

CLEARANCE_LEVELS = {
    "LEVEL-5 COSMIC TOP SECRET": 5,
    "LEVEL-5 EYES ONLY": 5,
    "LEVEL-4 SECRET": 4,
    "LEVEL-3 CONFIDENTIAL": 3,
    "LEVEL-2 RESTRICTED": 2,
    "LEVEL-1 UNCLASSIFIED": 1,
}


class PolicyGateResult(BaseModel):
    status: str  # "PASSED", "FLAGGED_FOR_APPROVAL", "BLOCKED_BY_POLICY"
    is_safe: bool
    requires_human_approval: bool
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    violations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    action_type: str = "RECOMMENDATION"
    required_clearance: str = "LEVEL-5 COSMIC TOP SECRET"
    policy_summary: str = ""


class PolicyGate:
    """Deterministic server-side security & policy gatekeeper."""

    @property
    def thresholds(self) -> Dict[str, Any]:
        return scenario_engine.get_policy_thresholds()

    def evaluate_plan(self, plan: Dict[str, Any], scenario_id: str) -> PolicyGateResult:
        """
        Validates proposed operational actions against statutory rules.
        Never trusts client/LLM flags.
        """
        violations = []
        warnings = []
        requires_human_approval = False
        risk_level = "LOW"

        spr_policy = self.thresholds.get("spr_policy", {})
        proc_policy = self.thresholds.get("procurement_policy", {})

        # 1. Audit SPR Drawdown Policy
        spr_plan = plan.get("spr_plan") or {}
        drawdown_allocated = 0.0
        if spr_plan:
            reserve_pct = float(
                spr_plan.get("reserve_after_action_pct")
                if spr_plan.get("reserve_after_action_pct") is not None
                else (spr_plan.get("reserve_after_pct") or 100.0)
            )
            statutory_min = float(spr_policy.get("statutory_minimum_reserve_pct", 30.0))
            warning_level = float(spr_policy.get("warning_reserve_pct", 50.0))
            if reserve_pct < statutory_min:
                violations.append(
                    f"STATUTORY BREACH: Strategic Petroleum Reserve would fall to {reserve_pct}%, "
                    f"below the sovereign critical floor of {statutory_min}%."
                )
            elif reserve_pct < warning_level:
                requires_human_approval = True
                risk_level = "HIGH"
                warnings.append(
                    f"RESERVE SAFETY WARNING: SPR post-action level ({reserve_pct:.1f}%) "
                    f"drops below warning threshold ({warning_level}%). Cabinet authorization required."
                )


            drawdown_allocated = float(
                spr_plan.get("total_drawdown_required_mbbl")
                or spr_plan.get("total_drawdown_allocated_mbbl")
                or sum(float(s.get("drawdown_allocated_mbbl") or 0.0) for s in spr_plan.get("sites", []))
            )
            max_auto = float(spr_policy.get("max_autonomous_drawdown_mbbl", 5.0))
            if drawdown_allocated > max_auto:
                requires_human_approval = True
                risk_level = "HIGH"
                warnings.append(
                    f"BOUNDED AUTONOMY TRIGGER: Requested SPR release of {drawdown_allocated:.2f}M bbl "
                    f"exceeds the autonomous authorization ceiling ({max_auto}M bbl)."
                )


        # 2. Audit Procurement & Sanctions Policy
        proc_plan = plan.get("procurement_plan") or {}
        suppliers = proc_plan.get("recommended_mix") or []
        for s in suppliers:
            vol = float(s.get("recommended_volume_mbbl") or 0.0)
            if vol <= 0:
                continue

            # Check for banned/disrupted entities
            if (
                s.get("verdict", "").startswith("REJECTED")
                or "BLOCKED" in s.get("sanctions_status", "")
                or "SANCTIONED" in s.get("compliance_status", "")
                or "SANCTIONED" in s.get("sanctions_status", "")
            ):
                violations.append(
                    f"SANCTIONS VIOLATION: Proposed procurement from blocked/sanctioned supplier {s.get('name')} "
                    f"({s.get('compliance_status') or s.get('sanctions_status')})."
                )

            # Check landed cost ceiling
            cost = float(s.get("landed_cost_usd_bbl") or 0.0)
            cost_ceiling = float(proc_policy.get("landed_cost_escalation_ceiling_usd_bbl", 115.0))
            if cost > cost_ceiling:
                warnings.append(
                    f"FISCAL THRESHOLD EXCEEDED: Landed cost for {s.get('name')} (${cost}/bbl) "
                    f"exceeds sovereign ceiling (${cost_ceiling}/bbl)."
                )

            # Check route risk
            route_risk = int(s.get("risk_score") or 0)
            max_route_risk = int(proc_policy.get("max_acceptable_route_risk", 70))
            if route_risk > max_route_risk:
                requires_human_approval = True
                if risk_level != "CRITICAL":
                    risk_level = "HIGH"
                warnings.append(
                    f"MARITIME WAR RISK: Transit route '{s.get('route')}' has risk score {route_risk}/100 "
                    f"(maximum autonomous tolerance: {max_route_risk})."
                )


        # 3. Assess Action Type & High-Risk Boundaries
        action_type = plan.get("action_type") or ("SPR_RELEASE" if spr_plan and spr_plan.get("total_drawdown_allocated_mbbl", 0) > 0 else "PROCUREMENT_REROUTE")
        mandatory_human_actions = self.thresholds.get("governance_and_approval", {}).get("mandatory_human_approval_actions", [])
        if action_type in mandatory_human_actions:
            requires_human_approval = True
            if risk_level != "CRITICAL":
                risk_level = "HIGH"

        # Determine Final Gate Verdict
        if violations:
            status = "BLOCKED_BY_POLICY"
            is_safe = False
            risk_level = "CRITICAL"
            summary = f"Execution BLOCKED by Sovereign Policy Gate: {len(violations)} statutory violation(s) detected."
        elif requires_human_approval:
            status = "FLAGGED_FOR_APPROVAL"
            is_safe = False  # Not safe for autonomous execution; requires human authorization
            summary = (
                f"Policy Gate requires MANDATORY HUMAN APPROVAL: High-risk action '{action_type}' "
                f"exceeds autonomous thresholds. {len(warnings)} policy advisory flag(s)."
            )
        else:
            status = "PASSED"
            is_safe = True
            risk_level = "LOW"
            summary = "Policy Gate PASSED: Proposed actions comply with all sovereign reserve, sanctions, and trade rules."

        return PolicyGateResult(
            status=status,
            is_safe=is_safe,
            requires_human_approval=requires_human_approval,
            risk_level=risk_level,
            violations=violations,
            warnings=warnings,
            action_type=action_type,
            required_clearance="LEVEL-5 COSMIC TOP SECRET" if risk_level in ("HIGH", "CRITICAL") else "LEVEL-3 CONFIDENTIAL",
            policy_summary=summary,
        )

    def authorize_operator_action(
        self,
        operator: Optional[DBUser],
        required_clearance: str,
        run: Optional[AgentRun] = None
    ) -> Dict[str, Any]:
        """
        Validates operator identity, active role, and security clearance level.
        Prevents unauthorized users from approving/rejecting runs.
        """
        if not operator:
            return {"authorized": False, "reason": "Operator identity not authenticated."}

        if operator.status != "ACTIVE":
            return {"authorized": False, "reason": f"Operator account is {operator.status}."}

        user_clearance = operator.clearance_level or "LEVEL-1 UNCLASSIFIED"
        user_rank = CLEARANCE_LEVELS.get(user_clearance, 1)
        req_rank = CLEARANCE_LEVELS.get(required_clearance, 4)

        if user_rank < req_rank:
            return {
                "authorized": False,
                "reason": (
                    f"Insufficient security clearance. Operator has '{user_clearance}' "
                    f"but action requires minimum '{required_clearance}'."
                )
            }

        # Role-specific checks
        allowed_roles = {
            "System Administrator",
            "Admin",
            "National Energy Commander",
            "Executive Director (Cabinet Level)",
            "SPR Administrator"
        }
        if operator.role not in allowed_roles:
            return {
                "authorized": False,
                "reason": f"Role '{operator.role}' does not hold cabinet authorization to approve high-risk energy directives."
            }

        return {"authorized": True, "clearance_verified": user_clearance}


# Singleton policy gate instance
policy_gate = PolicyGate()
