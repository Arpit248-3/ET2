"""
Structured logging helpers for AI requests.

The logger records operational metadata only. It never logs API keys, request
headers, or raw secrets.
"""

from __future__ import annotations

import json
import logging as py_logging
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional


LOGGER_NAME = "urjanetra.ai"


class AIRequestLogger:
    """Emit sanitized structured logs for AI provider and validation events."""

    def __init__(self, logger_name: str = LOGGER_NAME) -> None:
        self.logger = py_logging.getLogger(logger_name)

    def log_event(
        self,
        *,
        event: str,
        request_id: Optional[str] = None,
        agent: Optional[str] = None,
        selected_model: Optional[str] = None,
        latency_ms: Optional[float] = None,
        retries: Optional[int] = None,
        validation_result: Optional[str] = None,
        errors: Optional[Iterable[Any]] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log one structured AI event with sensitive fields removed."""

        payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "request_id": request_id,
            "agent": agent,
            "selected_model": selected_model,
            "latency_ms": latency_ms,
            "retries": retries,
            "validation_result": validation_result,
            "errors": list(errors or []),
        }
        if extra:
            payload.update(self._sanitize(extra))

        self.logger.info(json.dumps(payload, sort_keys=True, default=str))

    def _sanitize(self, value: Any) -> Any:
        """Remove values for fields that might contain secrets."""

        if isinstance(value, dict):
            sanitized: Dict[str, Any] = {}
            for key, item in value.items():
                lowered = str(key).lower()
                if any(token in lowered for token in ("api_key", "apikey", "authorization", "secret", "token")):
                    sanitized[key] = "[REDACTED]"
                else:
                    sanitized[key] = self._sanitize(item)
            return sanitized
        if isinstance(value, list):
            return [self._sanitize(item) for item in value]
        return value
