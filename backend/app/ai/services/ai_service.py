"""
Central AI orchestration service.

AIService is the only layer that future endpoints and agents should use. It
coordinates context building, prompt assembly, retrieval hooks, OpenRouter
calls, validation, memory, and logging.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, Optional

from app.ai.exceptions import AIException
from app.ai.logging import AIRequestLogger
from app.ai.memory.session_memory import SessionMemoryStore
from app.ai.models.ai_models import (
    AgentKind,
    AICompletionRequest,
    AIServiceResult,
    ModelRole,
)
from app.ai.prompts.templates import get_output_schema
from app.ai.rag.retriever import Retriever
from app.ai.services.context_builder import ContextBuilder
from app.ai.services.openrouter_client import OpenRouterClient
from app.ai.services.prompt_builder import PromptBuilder
from app.ai.services.response_validator import ResponseValidator


ClientFactory = Callable[[], OpenRouterClient]


class AIService:
    """Single reusable entry point for all AI-assisted backend workflows."""

    MODEL_ROLE_BY_AGENT = {
        AgentKind.PLANNER: ModelRole.COPILOT,
        AgentKind.EXPLAINABILITY: ModelRole.EXPLAIN,
        AgentKind.SPR: ModelRole.SPR,
        AgentKind.REDTEAM: ModelRole.REDTEAM,
        AgentKind.REPORT: ModelRole.REPORT,
        AgentKind.COPILOT: ModelRole.COPILOT,
    }

    def __init__(
        self,
        *,
        openrouter_client: Optional[Any] = None,
        client_factory: Optional[Callable[[], Any]] = None,
        context_builder: Optional[ContextBuilder] = None,
        prompt_builder: Optional[PromptBuilder] = None,
        response_validator: Optional[ResponseValidator] = None,
        retriever: Optional[Retriever] = None,
        memory: Optional[SessionMemoryStore] = None,
        logger: Optional[AIRequestLogger] = None,
    ) -> None:
        self._openrouter_client = openrouter_client
        self._client_factory = client_factory or OpenRouterClient
        self.context_builder = context_builder or ContextBuilder()
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.response_validator = response_validator or ResponseValidator()
        self.retriever = retriever or Retriever()
        self.memory = memory or SessionMemoryStore()
        self.logger = logger or AIRequestLogger()

    async def generate_explanation(
        self,
        *,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
    ) -> AIServiceResult:
        """Generate an explainability response through the centralized AI flow."""

        return await self._run_agent(
            agent=AgentKind.EXPLAINABILITY,
            user_query=user_query,
            context_inputs=context_inputs,
            output_schema=output_schema,
            conversation_id=conversation_id,
        )

    async def generate_report(
        self,
        *,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
    ) -> AIServiceResult:
        """Generate an executive report response through the centralized AI flow."""

        return await self._run_agent(
            agent=AgentKind.REPORT,
            user_query=user_query,
            context_inputs=context_inputs,
            output_schema=output_schema,
            conversation_id=conversation_id,
        )

    async def run_red_team(
        self,
        *,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
    ) -> AIServiceResult:
        """Run a red-team validation response through the centralized AI flow."""

        return await self._run_agent(
            agent=AgentKind.REDTEAM,
            user_query=user_query,
            context_inputs=context_inputs,
            output_schema=output_schema,
            conversation_id=conversation_id,
        )

    async def run_copilot(
        self,
        *,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
    ) -> AIServiceResult:
        """Run a copilot response through the centralized AI flow."""

        return await self._run_agent(
            agent=AgentKind.COPILOT,
            user_query=user_query,
            context_inputs=context_inputs,
            output_schema=output_schema,
            conversation_id=conversation_id,
        )

    async def generate_spr_analysis(
        self,
        *,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
    ) -> AIServiceResult:
        """Generate an SPR analysis response through the centralized AI flow."""

        return await self._run_agent(
            agent=AgentKind.SPR,
            user_query=user_query,
            context_inputs=context_inputs,
            output_schema=output_schema,
            conversation_id=conversation_id,
        )

    async def run_planner(
        self,
        *,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
    ) -> AIServiceResult:
        """Run a planner response through the centralized AI flow."""

        return await self._run_agent(
            agent=AgentKind.PLANNER,
            user_query=user_query,
            context_inputs=context_inputs,
            output_schema=output_schema,
            conversation_id=conversation_id,
        )

    async def _run_agent(
        self,
        *,
        agent: AgentKind,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]],
        output_schema: Optional[Dict[str, Any]],
        conversation_id: Optional[str],
    ) -> AIServiceResult:
        """Run shared orchestration for every AI capability."""

        schema = output_schema or get_output_schema(agent)
        context = self.context_builder.build_context(**(context_inputs or {}))
        knowledge = self.retriever.retrieve(query=user_query, context=context)
        prompt = self.prompt_builder.build_prompt(
            agent=agent,
            context=context,
            user_query=user_query,
            output_schema=schema,
            retrieved_knowledge=knowledge,
        )
        completion_request = AICompletionRequest(
            agent=agent,
            model_role=self.MODEL_ROLE_BY_AGENT[agent],
            messages=prompt.messages,
            output_schema=schema,
        )

        try:
            completion = await self._client().complete(completion_request)
            response_data = completion.parsed_json if completion.parsed_json is not None else {"text": completion.content}
            validation = self.response_validator.validate(
                response_data,
                output_schema=schema,
                context=context,
            )
            success = validation.is_valid
            result = AIServiceResult(
                success=success,
                request_id=completion.request_id,
                agent=agent,
                data=validation.normalized_response if success else None,
                validation=validation,
                error=None if success else {"error_type": "AI_VALIDATION_ERROR", "details": validation.model_dump(mode="json")},
                metadata={
                    "selected_model": completion.selected_model,
                    "latency_ms": completion.latency_ms,
                    "retries": completion.retries,
                },
            )
            self.logger.log_event(
                event="ai_service.validation",
                request_id=result.request_id,
                agent=agent.value,
                selected_model=completion.selected_model,
                latency_ms=completion.latency_ms,
                retries=completion.retries,
                validation_result="passed" if success else "failed",
                errors=[issue.model_dump(mode="json") for issue in validation.errors],
            )
            self._remember(
                conversation_id=conversation_id,
                user_query=user_query,
                context=context,
                result=result,
            )
            return result
        except AIException as exc:
            error_payload = exc.to_error_response()
            result = AIServiceResult(
                success=False,
                request_id=exc.request_id or completion_request.request_id,
                agent=agent,
                error=error_payload,
            )
            self.logger.log_event(
                event="ai_service.error",
                request_id=result.request_id,
                agent=agent.value,
                validation_result="failed",
                errors=[error_payload],
            )
            return result

    def _client(self) -> Any:
        """Return an injected or lazily constructed OpenRouter client."""

        if self._openrouter_client is None:
            self._openrouter_client = self._client_factory()
        return self._openrouter_client

    def _remember(
        self,
        *,
        conversation_id: Optional[str],
        user_query: str,
        context: Dict[str, Any],
        result: AIServiceResult,
    ) -> None:
        """Store compact conversation memory when a conversation id is provided."""

        if not conversation_id:
            return

        scenario = context.get("scenario") if isinstance(context, dict) else None
        self.memory.set_current_scenario(conversation_id, scenario)
        self.memory.add_turn(
            conversation_id=conversation_id,
            request={"query": user_query},
            response={
                "success": result.success,
                "request_id": result.request_id,
                "agent": result.agent.value,
                "data": result.data,
                "error": result.error,
            },
        )
