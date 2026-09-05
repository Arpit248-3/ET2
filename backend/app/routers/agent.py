"""
Aegis Sovereign Agent API Router.
Exposes endpoints for running missions, streaming/querying persistent agent traces,
human-in-the-loop authorization gates, tool metadata discovery, and cryptographic audit verification.
"""
from __future__ import annotations

import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AgentRun, AgentStep, DBUser
from app.ai.orchestrator import aegis_orchestrator
from app.ai.tools.registry import aegis_tools
from app.core.audit_chain import verify_audit_chain
from app.routers.auth import get_current_user_optional

logger = logging.getLogger("urjanetra.api.agent")

router = APIRouter(prefix="/agent", tags=["Aegis Autonomous Agent"])


# Request / Response Schemas
class MissionRunRequest(BaseModel):
    scenario_id: str = Field(..., description="ID of the active scenario (e.g. 'hormuz_closure')")
    mission: str = Field(..., description="Strategic mission objective in natural language")
    user_id: Optional[str] = Field("admin_system", description="Initiating operator ID")


class ApprovalRequest(BaseModel):
    action: str = Field("APPROVE", description="Approval action: 'APPROVE' or 'REJECT'")
    notes: Optional[str] = Field(None, description="Authorization or rejection notes")


class ReplanRequest(BaseModel):
    feedback: str = Field(..., description="Operator guidance or new constraints for replanning")


@router.post("/run", summary="Launch Sovereign Agent Mission")
async def run_agent_mission(
    req: MissionRunRequest,
    db: Session = Depends(get_db),
    current_user: Optional[DBUser] = Depends(get_current_user_optional),
):
    """
    Initiates an authentic agent mission.
    The agent dynamically selects tools, executes against deterministic engines,
    subjects candidate Plan V1 to adversarial Red Team critique, executes replanning if rejected,
    runs the server-side Policy Gate, and pauses at Human Approval Gate if high-risk.
    """
    user_id = current_user.id if current_user else req.user_id
    try:
        result = await aegis_orchestrator.run_mission(
            mission=req.mission,
            scenario_id=req.scenario_id,
            user_id=user_id,
        )
        return result
    except Exception as e:
        logger.error(f"Error executing agent mission: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent mission execution failed: {str(e)}"
        )


@router.get("/runs", summary="List All Agent Execution Runs")
def list_agent_runs(db: Session = Depends(get_db)):
    """Reconstructs all historical agent runs from database persistence."""
    runs = db.query(AgentRun).order_by(AgentRun.started_at.desc()).limit(50).all()
    return [
        {
            "id": r.id,
            "scenario_id": r.scenario_id,
            "mission": r.mission,
            "user_id": r.user_id,
            "status": r.status,
            "current_step": r.current_step,
            "iteration": r.iteration,
            "max_iterations": r.max_iterations,
            "requires_human_approval": r.requires_human_approval,
            "approval_status": r.approval_status,
            "approved_by": r.approved_by,
            "safe_mode": r.safe_mode,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "step_count": db.query(AgentStep).filter(AgentStep.run_id == r.id).count(),
        }
        for r in runs
    ]


@router.get("/runs/{run_id}", summary="Get Full Agent Execution Trace")
def get_agent_run(run_id: str, db: Session = Depends(get_db)):
    """
    Returns complete persistent trace for an agent run.
    Reconstructs all AgentSteps from the database for refreshable, verifiable frontend rendering.
    """
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"AgentRun '{run_id}' not found.")

    return aegis_orchestrator._format_run_response(run, db)


@router.post("/runs/{run_id}/approve", summary="Authorize Paused High-Risk Mission")
async def approve_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[DBUser] = Depends(get_current_user_optional),
):
    """
    Executes Human-in-the-Loop authorization.
    Verifies operator identity & clearance level against required clearance.
    Persists decision, records chained audit event, and completes run.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required: Valid Bearer token or authenticated operator identity required to approve high-risk sovereign directives."
        )

    try:
        result = await aegis_orchestrator.approve_and_execute(run_id, current_user, db)
        return result
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Approval error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/runs/{run_id}/reject", summary="Reject Paused High-Risk Mission")
async def reject_run(
    run_id: str,
    req: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: Optional[DBUser] = Depends(get_current_user_optional),
):
    """Rejects a paused mission. Halts consequential execution and logs reason in audit trail."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required: Valid Bearer token or authenticated operator identity required to reject sovereign directives."
        )

    try:
        result = await aegis_orchestrator.reject_mission(
            run_id=run_id,
            operator=current_user,
            rejection_reason=req.notes or "Rejected by sovereign operator command.",
            db=db
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Rejection error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/runs/{run_id}/replan", summary="Operator-Triggered Replan")
async def operator_replan(
    run_id: str,
    req: ReplanRequest,
    db: Session = Depends(get_db),
    current_user: Optional[DBUser] = Depends(get_current_user_optional),
):
    """Allows operator to feed back new guidance or constraints, triggering a replan cycle."""
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"AgentRun '{run_id}' not found.")

    # Re-run mission with operator guidance appended
    enhanced_mission = f"{run.mission} [Operator Constraint: {req.feedback}]"
    result = await aegis_orchestrator.run_mission(
        mission=enhanced_mission,
        scenario_id=run.scenario_id,
        user_id=current_user.id if current_user else run.user_id,
    )
    return result


@router.get("/tools", summary="List All Aegis Tool Specifications")
def list_tools():
    """Returns strict tool registry definitions, schemas, clearance levels, and engine sources."""
    return {
        "count": len(aegis_tools),
        "tools": aegis_tools.get_all_definitions(),
    }


@router.get("/status", summary="Get Orchestrator Operational Status")
def get_orchestrator_status():
    """Reports agent operational mode (AI Orchestration vs Safe Mode), tool count, and config."""
    return {
        "status": "OPERATIONAL",
        "orchestrator": "AegisAgentOrchestrator v2.0",
        "mode": "AI_ORCHESTRATION" if not aegis_orchestrator.safe_mode_allowed else "ACTIVE_WITH_SAFE_MODE_FALLBACK",
        "max_iterations": aegis_orchestrator.max_iterations,
        "max_tool_calls": aegis_orchestrator.max_tool_calls,
        "timeout_seconds": aegis_orchestrator.timeout_seconds,
        "registered_tools_count": len(aegis_tools),
        "source_engines": [
            "risk_engine", "procurement_engine", "spr_engine", "compliance_engine",
            "economic_engine", "scenario_engine", "redteam_engine", "policy_gate"
        ],
        "data_status": "DEMO / SYNTHETIC OPERATIONAL DATA",
    }


@router.get("/audit/verify", summary="Verify Tamper-Evident Audit Chain")
def verify_chain(db: Session = Depends(get_db)):
    """Cryptographically validates the SHA-256 hash chain of all system and agent audit events."""
    return verify_audit_chain(db)
