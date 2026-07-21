"""
Copilot & Multi-Agent Intelligence Router.

Endpoints:
  POST /api/ai/copilot
  POST /api/copilot/query
  POST /api/ai/explainability
  POST /api/ai/redteam
  POST /api/ai/report
  POST /api/ai/compare
  POST /api/ai/whatif
  POST /api/ai/confidence
"""
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException

from app.ai.graph.workflow import workflow
from app.ai.graph.multi_agent_workflow import multi_agent_orchestrator

logger = logging.getLogger("urjanetra.routers.copilot")
router = APIRouter()


class CopilotQueryRequest(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None
    conversation_id: Optional[str] = None
    stream: bool = False


class MultiAgentRequest(BaseModel):
    query: Optional[str] = None
    scenario_id: Optional[str] = None
    recommendation: Optional[str] = None
    strategies: Optional[List[str]] = None
    parameters: Optional[Dict[str, Any]] = None


async def _handle_copilot_request(req: CopilotQueryRequest) -> Dict[str, Any]:
    user_query = req.query or req.message
    if not user_query or not user_query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")

    graph_state = await workflow.run(user_query.strip())
    resp = graph_state.validated_response or {}

    summary = resp.get("summary", "Analysis completed.")
    reasoning = resp.get("reasoning", [])
    evidence = resp.get("evidence", [])
    alternatives = resp.get("alternatives", [])
    confidence = resp.get("confidence", 0.91)
    limitations = resp.get("limitations", [])
    next_action = resp.get("next_action", "Maintain routine baseline monitoring.")

    linked_pages = []
    if "procurement" in graph_state.required_engines:
        linked_pages.append("/procurement-optimizer")
    if "spr" in graph_state.required_engines:
        linked_pages.append("/spr-planner")
    if "risk" in graph_state.required_engines:
        linked_pages.append("/risk-intelligence")
    if "compliance" in graph_state.required_engines:
        linked_pages.append("/compliance-shield")
    if not linked_pages:
        linked_pages.append("/command-center")

    metadata = {
        "intent": graph_state.intent,
        "required_engines": graph_state.required_engines,
        "retrieved_documents_count": len(graph_state.retrieved_documents),
        "selected_model": graph_state.selected_model,
        "latency_ms": graph_state.latency_ms,
        "fallback_used": graph_state.fallback_used,
    }

    meta_ctx = graph_state.pipeline_context.get("metadata", {})
    trace = {
        "trace_id": f"trc-{graph_state.request_id}",
        "execution_id": meta_ctx.get("execution_id", "N/A"),
        "scenario_id": meta_ctx.get("scenario_id", "baseline"),
        "pipeline_version": meta_ctx.get("version", 1),
        "engine_outputs_used": graph_state.required_engines,
        "retrieved_documents": [{"source": d["source"], "title": d["title"]} for d in graph_state.retrieved_documents],
        "prompt_version": "1.0.0",
        "validation_status": "PASSED" if not graph_state.fallback_used else "FALLBACK_USED",
        "model_used": graph_state.selected_model,
        "latency_ms": graph_state.latency_ms,
    }

    evidence_str = "\n".join(f"[{item.get('source', 'RAG')}] {item.get('detail', '')}" for item in evidence if isinstance(item, dict))

    return {
        "summary": summary,
        "reasoning": reasoning,
        "evidence": evidence,
        "alternatives": alternatives,
        "confidence": confidence,
        "limitations": limitations,
        "next_action": next_action,
        "metadata": metadata,
        "trace": trace,
        "answer": summary + ("\n\n**Key Findings:**\n- " + "\n- ".join(reasoning) if reasoning else ""),
        "recommended_actions": [next_action] if next_action else [],
        "linked_pages": linked_pages,
        "evidence_str": evidence_str,
    }


@router.post("/ai/copilot")
async def copilot_endpoint(req: CopilotQueryRequest):
    return await _handle_copilot_request(req)


@router.post("/copilot/query")
async def copilot_query_endpoint(req: CopilotQueryRequest):
    return await _handle_copilot_request(req)


# ─── Specialized Multi-Agent Endpoints ────────────────────────────────────────

@router.post("/ai/explainability")
async def explainability_endpoint(req: MultiAgentRequest):
    """POST /api/ai/explainability — Triggers ExplainabilityAgent."""
    return await multi_agent_orchestrator.execute("explainability", req.query, req.scenario_id, req.parameters)


@router.post("/ai/redteam")
async def redteam_endpoint(req: MultiAgentRequest):
    """POST /api/ai/redteam — Triggers RedTeamAgent."""
    return await multi_agent_orchestrator.execute("redteam", req.query or req.recommendation, req.scenario_id, req.parameters)


@router.post("/ai/report")
async def report_endpoint(req: MultiAgentRequest):
    """POST /api/ai/report — Triggers ExecutiveReportAgent."""
    return await multi_agent_orchestrator.execute("report", req.query, req.scenario_id, req.parameters)


@router.post("/ai/compare")
async def compare_endpoint(req: MultiAgentRequest):
    """POST /api/ai/compare — Triggers ComparisonAgent."""
    return await multi_agent_orchestrator.execute("compare", req.query, req.scenario_id, req.parameters)


@router.post("/ai/whatif")
async def whatif_endpoint(req: MultiAgentRequest):
    """POST /api/ai/whatif — Triggers WhatIfAgent."""
    return await multi_agent_orchestrator.execute("whatif", req.query, req.scenario_id, req.parameters)


@router.post("/ai/confidence")
async def confidence_endpoint(req: MultiAgentRequest):
    """POST /api/ai/confidence — Triggers ConfidenceReviewAgent."""
    return await multi_agent_orchestrator.execute("confidence", req.query, req.scenario_id, req.parameters)
