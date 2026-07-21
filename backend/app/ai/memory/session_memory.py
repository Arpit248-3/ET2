"""
Lightweight replaceable session memory for AI conversations.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.ai.models.ai_models import SessionMemoryRecord


class SessionMemoryStore:
    """In-memory conversation state for current scenario, requests, and AI responses."""

    def __init__(self, max_items_per_session: int = 10) -> None:
        self.max_items_per_session = max_items_per_session
        self._sessions: Dict[str, SessionMemoryRecord] = {}

    def get(self, conversation_id: str) -> SessionMemoryRecord:
        """Return existing memory or create a new record for a conversation."""

        if conversation_id not in self._sessions:
            self._sessions[conversation_id] = SessionMemoryRecord(conversation_id=conversation_id)
        return self._sessions[conversation_id]

    def set_current_scenario(self, conversation_id: str, scenario: Optional[Dict[str, Any]]) -> None:
        """Update the current scenario associated with a conversation."""

        record = self.get(conversation_id)
        record.current_scenario = scenario
        record.updated_at = datetime.now(timezone.utc).isoformat()

    def add_turn(
        self,
        *,
        conversation_id: str,
        request: Dict[str, Any],
        response: Dict[str, Any],
    ) -> None:
        """Append a compact request and response pair to memory."""

        record = self.get(conversation_id)
        record.previous_requests.append(request)
        record.recent_ai_responses.append(response)
        record.previous_requests = record.previous_requests[-self.max_items_per_session :]
        record.recent_ai_responses = record.recent_ai_responses[-self.max_items_per_session :]
        record.updated_at = datetime.now(timezone.utc).isoformat()

    def snapshot(self, conversation_id: str) -> Dict[str, Any]:
        """Return a JSON-compatible memory snapshot."""

        return self.get(conversation_id).model_dump(mode="json")

    def clear(self, conversation_id: str) -> None:
        """Remove one conversation from memory."""

        self._sessions.pop(conversation_id, None)
