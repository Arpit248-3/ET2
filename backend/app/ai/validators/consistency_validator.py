"""
Consistency validation boundary for AI responses.

The current implementation performs only provider-agnostic sanity checks.
Future phases can add cross-field and context-grounding checks here.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.ai.models.ai_models import ValidationIssue, ValidationResult


class ConsistencyValidator:
    """Validate internal consistency of AI responses."""

    def validate(self, response: Any, context: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Return a consistency validation result without raising."""

        if isinstance(response, dict) and response.get("error"):
            return ValidationResult(
                is_valid=False,
                errors=[
                    ValidationIssue(
                        stage="consistency",
                        code="provider_error_payload",
                        message="AI response contains an error field.",
                        path="$.error",
                    )
                ],
            )

        # TODO Phase 3: add cross-field and context-grounding checks.
        normalized = response if isinstance(response, dict) else {"value": response}
        return ValidationResult(is_valid=True, normalized_response=normalized)
