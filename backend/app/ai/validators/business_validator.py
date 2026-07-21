"""
Business validation boundary for AI responses.

Phase 2 intentionally avoids embedding new business logic here. The class
exists so future phases can add policy and domain checks without changing
AIService orchestration.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.ai.models.ai_models import ValidationIssue, ValidationResult


class BusinessValidator:
    """Validate AI responses against domain rules when those rules are added."""

    def validate(self, response: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Return a pass-through result until business rules are introduced."""

        if response is None:
            return ValidationResult(
                is_valid=False,
                errors=[
                    ValidationIssue(
                        stage="business",
                        code="empty_response",
                        message="AI response cannot be empty.",
                    )
                ],
            )

        # TODO Phase 3: add domain-specific checks without changing AIService.
        normalized = response if isinstance(response, dict) else {"value": response}
        return ValidationResult(is_valid=True, normalized_response=normalized)
