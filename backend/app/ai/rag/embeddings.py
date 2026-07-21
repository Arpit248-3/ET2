"""
Embedding provider interfaces for future RAG support.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List


class EmbeddingProvider(ABC):
    """Interface for converting text into embedding vectors."""

    @abstractmethod
    def embed(self, text: str) -> List[float]:
        """Return an embedding vector for text."""


class DeferredEmbeddingProvider(EmbeddingProvider):
    """No-op embedding provider reserved for Phase 4."""

    def embed(self, text: str) -> List[float]:
        """Return an empty vector until embeddings are implemented."""

        # TODO Phase 4: connect to the approved embedding provider.
        return []
