"""
Typed data contracts shared across the AI infrastructure layer.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class AgentKind(str, Enum):
    """Supported AI agent identifiers."""

    PLANNER = "planner"
    EXPLAINABILITY = "explainability"
    SPR = "spr"
    REDTEAM = "redteam"
    REPORT = "report"
    COPILOT = "copilot"


class ModelRole(str, Enum):
    """OpenRouter model role names backed by .env configuration."""

    COPILOT = "copilot"
    EXPLAIN = "explain"
    REDTEAM = "redteam"
    REPORT = "report"
    SPR = "spr"


class AIMessage(BaseModel):
    """A chat message sent to or returned from a model provider."""

    role: Literal["system", "user", "assistant", "tool"]
    content: str


class KnowledgeChunk(BaseModel):
    """A retrieved knowledge item prepared for prompt assembly."""

    id: str
    content: str
    source: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AIPrompt(BaseModel):
    """A complete prompt payload before model selection."""

    agent: AgentKind
    system_prompt: str
    context: Dict[str, Any] = Field(default_factory=dict)
    retrieved_knowledge: List[KnowledgeChunk] = Field(default_factory=list)
    user_query: str = ""
    output_schema: Dict[str, Any] = Field(default_factory=dict)
    messages: List[AIMessage] = Field(default_factory=list)


class AICompletionRequest(BaseModel):
    """Provider-agnostic request passed into OpenRouterClient."""

    agent: AgentKind
    model_role: ModelRole
    messages: List[AIMessage]
    output_schema: Dict[str, Any] = Field(default_factory=dict)
    request_id: str = Field(default_factory=lambda: uuid4().hex)
    response_format: Literal["text", "json_object"] = "json_object"
    stream: bool = False


class AIUsage(BaseModel):
    """Token usage returned by an AI provider when available."""

    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None


class ValidationIssue(BaseModel):
    """A structured validation issue returned by validators."""

    stage: str
    code: str
    message: str
    path: Optional[str] = None


class ValidationResult(BaseModel):
    """The aggregate result of response validation."""

    is_valid: bool
    errors: List[ValidationIssue] = Field(default_factory=list)
    warnings: List[ValidationIssue] = Field(default_factory=list)
    normalized_response: Optional[Dict[str, Any]] = None


class AICompletionResponse(BaseModel):
    """Normalized response returned by OpenRouterClient."""

    request_id: str
    agent: AgentKind
    selected_model: str
    content: str
    parsed_json: Optional[Dict[str, Any]] = None
    usage: Optional[AIUsage] = None
    latency_ms: float = 0.0
    retries: int = 0


class AIServiceResult(BaseModel):
    """Stable service response for future API endpoints and agents."""

    success: bool
    request_id: str
    agent: AgentKind
    data: Optional[Dict[str, Any]] = None
    validation: Optional[ValidationResult] = None
    error: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SessionMemoryRecord(BaseModel):
    """Lightweight conversation memory stored by session id."""

    conversation_id: str
    current_scenario: Optional[Dict[str, Any]] = None
    previous_requests: List[Dict[str, Any]] = Field(default_factory=list)
    recent_ai_responses: List[Dict[str, Any]] = Field(default_factory=list)
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
