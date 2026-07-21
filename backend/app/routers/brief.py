"""
POST /api/brief/generate — Generate executive decision brief powered by ExecutiveReportAgent.
"""
import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import ScenarioState, PipelineResult
from app.schemas import BriefRequest, BriefResponse
from app.ai.agents.report_agent import run_report_agent
from app.pipeline.controller import controller
from app.pipeline.models import ExecutionContext
from app.pipeline.serializer import serialize
from app.ai.rag.retriever import Retriever
from app.routers.audit import create_audit_entry
from sqlalchemy.orm.attributes import flag_modified

router = APIRouter()


@router.post("/brief/generate", response_model=BriefResponse)
async def create_brief(request: BriefRequest, db: Session = Depends(get_db)):
    state = db.query(ScenarioState).filter(ScenarioState.id == 1).first()
    scenario_id = request.scenario_id or (state.active_scenario_id if state else None)

    ctx = ExecutionContext(scenario_id=scenario_id, trigger="REPORT_AGENT_API")
    pipeline_state = controller.run(context=ctx)
    pipeline_dict = serialize(pipeline_state)

    retriever = Retriever()
    rag_docs = retriever.retrieve(query="Executive Report Decision Brief", limit=5)

    agent_result = await run_report_agent(pipeline_dict, rag_docs)

    brief_id = f"BRIEF-{datetime.now(timezone.utc).strftime('%Y%m%d')}-001"
    subj = f"National Energy Resilience Brief — Scenario: {scenario_id or 'Baseline'}"

    sections = [
        {"title": "1. SITUATION OVERVIEW", "content": agent_result.get("situation_overview", "")},
        {"title": "2. KEY RISKS", "content": "\n".join(f"• {r}" for r in agent_result.get("key_risks", []))},
        {"title": "3. ECONOMIC IMPACT", "content": agent_result.get("economic_impact", "")},
        {"title": "4. RECOMMENDED ACTION", "content": agent_result.get("recommended_action", "")},
        {"title": "5. WHY THIS ACTION", "content": "\n".join(f"• {w}" for w in agent_result.get("why", []))},
        {"title": "6. EXPECTED BENEFITS & RISKS", "content": "Benefits:\n" + "\n".join(f"• {b}" for b in agent_result.get("expected_benefits", [])) + "\n\nRisks:\n" + "\n".join(f"• {rk}" for rk in agent_result.get("expected_risks", []))},
    ]

    actions = agent_result.get("immediate_actions", []) + agent_result.get("long_term_actions", [])

    create_audit_entry(
        db=db,
        user="Executive Report AI",
        action=f"Executive Brief Generated: {brief_id}",
        module="Action Brief",
        event_type="AI",
        details={"brief_id": brief_id, "classification": request.classification},
    )

    return BriefResponse(
        brief_id=brief_id,
        classification=request.classification or "Official / Restricted",
        prepared_for=request.prepared_for or "Ministry of Petroleum and Natural Gas",
        prepared_by="UrjaNetra Executive Report Agent",
        date=datetime.now(timezone.utc).strftime("%d %b %Y"),
        subject=subj,
        sections=sections,
        decision_required=agent_result.get("decision_required", "Cabinet Committee on Security Approval"),
        timestamp=datetime.now(timezone.utc).isoformat(),
        actions=actions,
    )
