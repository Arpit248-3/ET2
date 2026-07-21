"""
Placeholder copilot agent.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.ai.services.ai_service import AIService


class CopilotAgent:
    """Copilot agent facade that delegates all AI work to AIService."""

    def __init__(self, ai_service: AIService) -> None:
        self.ai_service = ai_service

    async def run(
        self,
        *,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
    ):
        """Run a copilot interaction through AIService."""

        return await self.ai_service.run_copilot(
            user_query=user_query,
            context_inputs=context_inputs,
            conversation_id=conversation_id,
        )
