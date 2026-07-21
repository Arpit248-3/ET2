"""
Placeholder planner agent.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.ai.services.ai_service import AIService


class PlannerAgent:
    """Planner agent facade that delegates all AI work to AIService."""

    def __init__(self, ai_service: AIService) -> None:
        self.ai_service = ai_service

    async def run(
        self,
        *,
        user_query: str,
        context_inputs: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
    ):
        """Run planner analysis through AIService."""

        return await self.ai_service.run_planner(
            user_query=user_query,
            context_inputs=context_inputs,
            conversation_id=conversation_id,
        )
