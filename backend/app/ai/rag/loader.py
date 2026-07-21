"""
Knowledge loading interfaces for future RAG support.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable, List

from app.ai.models.ai_models import KnowledgeChunk


class KnowledgeLoader(ABC):
    """Interface for loading knowledge documents into RAG infrastructure."""

    @abstractmethod
    def load(self, sources: Iterable[str]) -> List[KnowledgeChunk]:
        """Load knowledge chunks from configured sources."""


class DeferredKnowledgeLoader(KnowledgeLoader):
    """No-op loader reserved for Phase 4 RAG implementation."""

    def load(self, sources: Iterable[str]) -> List[KnowledgeChunk]:
        """Return no chunks until a real loader is added."""

        # TODO Phase 4: implement document loading and chunking.
        return []
