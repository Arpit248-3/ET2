"""
LangGraph State Schema for AI Copilot Orchestration.
Tracks state through intent classification, selective context collection, RAG document retrieval,
prompt assembly, OpenRouter execution, response validation, and fallback routing.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CopilotGraphState(BaseModel):
    request_id: str = ""
    user_query: str = ""
    intent: str = "general_query"
    required_engines: List[str] = Field(default_factory=list)
    pipeline_context: Dict[str, Any] = Field(default_factory=dict)
    retrieved_documents: List[Dict[str, Any]] = Field(default_factory=list)
    system_instruction: str = ""
    prompt_messages: List[Dict[str, str]] = Field(default_factory=list)
    draft_response: Optional[Dict[str, Any]] = None
    validated_response: Optional[Dict[str, Any]] = None
    validation_result: Dict[str, Any] = Field(default_factory=dict)
    retry_count: int = 0
    fallback_used: bool = False
    errors: List[str] = Field(default_factory=list)
    latency_ms: float = 0.0
    selected_model: str = "anthropic/claude-3.5-sonnet"
