"""
POST /api/redteam/validate — Red team validation of AI recommendation powered by RedTeamAgent.
"""
import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Dict, Any

from app.database import get_db
from app.models import ScenarioState
from app.schemas import RedTeamRequest, RedTeamResponse
from app.ai.agents.redteam_agent import run_redteam_agent
from app.pipeline.controller import controller
from app.pipeline.models import ExecutionContext
from app.pipeline.serializer import serialize
from app.ai.rag.retriever import Retriever
from app.routers.audit import create_audit_entry

router = APIRouter()


@router.post("/redteam/validate", response_model=RedTeamResponse)
async def red_team_validate(request: RedTeamRequest, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = request.scenario_id or (state.active_scenario_id if state else None)

    ctx = ExecutionContext(scenario_id=scenario_id, trigger="RED_TEAM_API")
    pipeline_state = controller.run(context=ctx)
    pipeline_dict = serialize(pipeline_state)

    retriever = Retriever()
    rag_docs = retriever.retrieve(query=request.recommendation or "Red Team Validation", limit=5)

    agent_result = await run_redteam_agent(pipeline_dict, rag_docs, request.recommendation)

    orig_conf = request.confidence or pipeline_dict.get("overall_confidence", 92.0) / 100.0
    adj_conf = agent_result.get("confidence_adjusted", round(orig_conf - 0.08, 2))

    weak_assumptions = agent_result.get("weaknesses", [])
    ignored_risks = agent_result.get("blind_spots", [])

    findings = []
    for ass in weak_assumptions[:3]:
        findings.append({"category": "Weak Assumption", "finding": ass, "severity": "MEDIUM"})
    for rsk in ignored_risks[:2]:
        findings.append({"category": "Ignored Risk", "finding": rsk, "severity": "HIGH"})

    create_audit_entry(
        db=db,
        user="Red Team AI",
        action=f"Red Team Validation — confidence adjusted from {orig_conf:.0%} to {adj_conf:.0%}",
        module="Red Team Validator",
        event_type="AI",
        details={"confidence_original": orig_conf, "confidence_adjusted": adj_conf},
    )

    return RedTeamResponse(
        original_recommendation=request.recommendation,
        critique=agent_result.get("overall_assessment", "Adversarial critique completed."),
        weak_assumptions=weak_assumptions,
        ignored_risks=ignored_risks,
        findings=findings,
        confidence_original=round(orig_conf, 2),
        confidence_adjusted=round(adj_conf, 2),
        final_recommendation=agent_result.get("alternative_strategy", "Maintain parallel inquiry with secondary supplier."),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
