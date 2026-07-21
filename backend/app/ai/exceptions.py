"""
Centralized exceptions for the UrjaNetra AI infrastructure.

Exceptions expose structured data for services and future endpoints while
keeping secrets out of error messages.
"""

from __future__ import annotations

from typing import Any, Dict, Optional


class AIException(Exception):
    """Base exception carrying a stable error code and optional request context."""

    error_code = "AI_ERROR"

    def __init__(
        self,
        message: str,
        *,
        request_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.request_id = request_id
        self.details = details or {}

    def to_error_response(self) -> Dict[str, Any]:
        """Return a structured, API-safe error payload."""

        return {
            "error_type": self.error_code,
            "message": self.message,
            "request_id": self.request_id,
            "details": self.details,
        }


class AIConnectionError(AIException):
    """Raised when OpenRouter cannot be reached or returns an unrecoverable status."""

    error_code = "AI_CONNECTION_ERROR"


class AIValidationError(AIException):
    """Raised when an AI response cannot pass the configured validation pipeline."""

    error_code = "AI_VALIDATION_ERROR"


class AITimeoutError(AIException):
    """Raised when an AI request exceeds the configured timeout."""

    error_code = "AI_TIMEOUT_ERROR"


class TimeoutError(AITimeoutError):
    """AI-specific timeout exception using the architecture's requested name."""


class ConfigurationError(AIException):
    """Raised when AI configuration is missing or invalid."""

    error_code = "AI_CONFIGURATION_ERROR"


class AIResponseError(AIException):
    """Raised when a provider response cannot be parsed into the expected structure."""

    error_code = "AI_RESPONSE_ERROR"
