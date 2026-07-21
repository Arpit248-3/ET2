"""
Conditional Routing Edges for LangGraph AI Copilot Orchestration.
Evaluates validation results to determine whether to complete execution, retry OpenRouter, or trigger fallback.
"""
import logging
from app.ai.graph.state import CopilotGraphState

logger = logging.getLogger("urjanetra.ai.graph.edges")


def route_after_validation(state: CopilotGraphState) -> str:
    """
    Conditional routing decision after response validation.
    Returns destination node name: 'complete', 'retry', or 'fallback'.
    """
    val_res = state.validation_result or {}
    is_valid = val_res.get("is_valid", False)

    if is_valid:
        logger.info(f"[{state.request_id}] Route Edge: Validation passed -> COMPLETE")
        return "complete"

    if state.retry_count < 1 and not state.fallback_used:
        state.retry_count += 1
        logger.warning(f"[{state.request_id}] Route Edge: Validation failed -> RETRY (attempt {state.retry_count})")
        return "retry"

    logger.warning(f"[{state.request_id}] Route Edge: Validation failed after retries -> FALLBACK")
    return "fallback"
