"""
Prompt assembly for AI workflows.

PromptBuilder combines a system prompt, normalized context JSON, retrieved
knowledge, user query, and output schema. It is model-provider agnostic.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Iterable, List, Optional

from app.ai.models.ai_models import AgentKind, AIMessage, AIPrompt, KnowledgeChunk
from app.ai.prompts.system_prompts import get_system_prompt


class PromptBuilder:
    """Assemble provider-neutral prompt payloads for AIService."""

    def build_prompt(
        self,
        *,
        agent: AgentKind | str,
        context: Dict[str, Any],
        user_query: str,
        output_schema: Dict[str, Any],
        retrieved_knowledge: Optional[Iterable[KnowledgeChunk | Dict[str, Any] | str]] = None,
        system_prompt: Optional[str] = None,
    ) -> AIPrompt:
        """Build a complete prompt from normalized inputs."""

        agent_kind = AgentKind(agent)
        knowledge_chunks = self._normalize_knowledge(retrieved_knowledge or [])
        system_content = system_prompt or get_system_prompt(agent_kind)
        user_content = self._build_user_content(
            context=context,
            retrieved_knowledge=knowledge_chunks,
            user_query=user_query,
            output_schema=output_schema,
        )

        messages = [
            AIMessage(role="system", content=system_content),
            AIMessage(role="user", content=user_content),
        ]
        return AIPrompt(
            agent=agent_kind,
            system_prompt=system_content,
            context=context,
            retrieved_knowledge=knowledge_chunks,
            user_query=user_query,
            output_schema=output_schema,
            messages=messages,
        )

    def _build_user_content(
        self,
        *,
        context: Dict[str, Any],
        retrieved_knowledge: List[KnowledgeChunk],
        user_query: str,
        output_schema: Dict[str, Any],
    ) -> str:
        """Create the user message content passed to the model."""

        context_json = json.dumps(context, indent=2, sort_keys=True, default=str)
        schema_json = json.dumps(output_schema, indent=2, sort_keys=True, default=str)
        knowledge_text = self._format_knowledge(retrieved_knowledge)
        return (
            "Context JSON:\n"
            f"{context_json}\n\n"
            "Retrieved Knowledge:\n"
            f"{knowledge_text}\n\n"
            "User Query:\n"
            f"{user_query or 'No user query provided.'}\n\n"
            "Output Schema:\n"
            f"{schema_json}"
        )

    def _normalize_knowledge(
        self,
        retrieved_knowledge: Iterable[KnowledgeChunk | Dict[str, Any] | str],
    ) -> List[KnowledgeChunk]:
        """Convert knowledge inputs into KnowledgeChunk models."""

        chunks: List[KnowledgeChunk] = []
        for index, item in enumerate(retrieved_knowledge):
            if isinstance(item, KnowledgeChunk):
                chunks.append(item)
            elif isinstance(item, dict):
                chunks.append(KnowledgeChunk(**item))
            else:
                chunks.append(KnowledgeChunk(id=f"knowledge-{index}", content=str(item)))
        return chunks

    def _format_knowledge(self, chunks: List[KnowledgeChunk]) -> str:
        """Format retrieved knowledge chunks for model consumption."""

        if not chunks:
            return "No retrieved knowledge supplied."

        lines = []
        for chunk in chunks:
            source = f" source={chunk.source}" if chunk.source else ""
            lines.append(f"- id={chunk.id}{source}: {chunk.content}")
        return "\n".join(lines)
