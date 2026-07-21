"""
CopilotWorkflow Graph Engine.
Compiles and executes the 7-node LangGraph orchestration workflow for AI Copilot queries.
"""
import uuid
import logging
from typing import Dict, Any, Optional

from app.ai.graph.state import CopilotGraphState
from app.ai.graph.nodes import (
    planner_agent_node,
    context_collection_node,
    rag_retrieval_node,
    prompt_builder_node,
    openrouter_node,
    response_validator_node,
    fallback_node,
)
from app.ai.graph.edges import route_after_validation

logger = logging.getLogger("urjanetra.ai.graph.workflow")


class CopilotWorkflow:
    """
    Orchestration Workflow Runner for AI Copilot.
    Executes Planner -> Context -> RAG -> Prompt -> OpenRouter -> Validation -> Fallback DAG sequence.
    """

    def __init__(self):
        self.logger = logger

    async def run(self, user_query: str, request_id: Optional[str] = None) -> CopilotGraphState:
        req_id = request_id or f"req-{uuid.uuid4().hex[:8]}"
        state = CopilotGraphState(
            request_id=req_id,
            user_query=user_query,
        )

        self.logger.info(f"[{req_id}] Starting Copilot Workflow for query: '{user_query}'")

        # Step 1: Planner Agent (Intent Detection)
        state = planner_agent_node(state)

        # Step 2: Selective Context Collection
        state = context_collection_node(state)

        # Step 3: RAG Document Retrieval
        state = rag_retrieval_node(state)

        # Step 4: Prompt Building with Strict Grounding Constraints
        state = prompt_builder_node(state)

        # Step 5: OpenRouter Execution
        state = await openrouter_node(state)

        # Step 6: Response Validation
        state = response_validator_node(state)

        # Step 7: Conditional Routing (Retry or Fallback)
        action = route_after_validation(state)

        if action == "retry":
            self.logger.info(f"[{req_id}] Executing retry pass via OpenRouter...")
            state = await openrouter_node(state)
            state = response_validator_node(state)
            action = route_after_validation(state)

        if action == "fallback" or not state.validated_response:
            state = fallback_node(state)

        self.logger.info(f"[{req_id}] Copilot Workflow completed | intent={state.intent} fallback={state.fallback_used}")
        return state


# Singleton workflow instance
workflow = CopilotWorkflow()
