"""
In-Memory State History Manager.
Stores up to MAX_HISTORY previous PipelineState versions for rollback and diffing.
Thread-safe. No database.
"""
import threading
import logging
from collections import deque
from typing import List, Optional, Any

logger = logging.getLogger("urjanetra.pipeline.history")

MAX_HISTORY = 50


class StateHistoryManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._history = deque(maxlen=MAX_HISTORY)
                cls._instance._rw_lock = threading.RLock()
        return cls._instance

    def push(self, state: Any) -> None:
        """Store a new version of the PipelineState."""
        with self._rw_lock:
            # Store a serialized snapshot to ensure immutability
            from app.pipeline.serializer import serialize
            snapshot = serialize(state)
            self._history.append(snapshot)
            logger.debug(
                f"State pushed. History depth: {len(self._history)}. "
                f"version={state.metadata.version}"
            )

    def get_all(self) -> List[dict]:
        """Return all stored state snapshots (oldest first)."""
        with self._rw_lock:
            return list(self._history)

    def get_latest(self) -> Optional[dict]:
        """Return the most recent state snapshot, or None."""
        with self._rw_lock:
            return self._history[-1] if self._history else None

    def get_by_version(self, version: int) -> Optional[dict]:
        """Return the snapshot whose metadata.version matches, or None."""
        with self._rw_lock:
            for snap in reversed(self._history):
                if snap.get("metadata", {}).get("version") == version:
                    return snap
            return None

    def rollback(self, version: int, model_class: Any) -> Optional[Any]:
        """
        Reconstruct and return a PipelineState at the given version.
        Does NOT remove later states from history.
        """
        snap = self.get_by_version(version)
        if snap is None:
            logger.warning(f"Rollback requested for version={version} — not found in history.")
            return None
        from app.pipeline.serializer import deserialize
        logger.info(f"Rolling back to version={version}")
        return deserialize(snap, model_class)

    def clear(self) -> None:
        """Flush all history (used by reset endpoint)."""
        with self._rw_lock:
            self._history.clear()
            logger.info("State history cleared.")

    def __len__(self) -> int:
        with self._rw_lock:
            return len(self._history)


# Singleton instance
history_manager = StateHistoryManager()
