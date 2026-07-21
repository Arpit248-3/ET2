"""
Validation pipeline for AI responses.

The pipeline order is schema validation, business validation, consistency
validation. Failures return structured ValidationResult objects instead of
raising exceptions.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.ai.models.ai_models import ValidationIssue, ValidationResult
from app.ai.validators.business_validator import BusinessValidator
from app.ai.validators.consistency_validator import ConsistencyValidator
from app.ai.validators.schema_validator import SchemaValidator


class ResponseValidator:
    """Run the complete AI response validation pipeline."""

    def __init__(
        self,
        *,
        schema_validator: Optional[SchemaValidator] = None,
        business_validator: Optional[BusinessValidator] = None,
        consistency_validator: Optional[ConsistencyValidator] = None,
    ) -> None:
        self.schema_validator = schema_validator or SchemaValidator()
        self.business_validator = business_validator or BusinessValidator()
        self.consistency_validator = consistency_validator or ConsistencyValidator()

    def validate(
        self,
        response: Any,
        *,
        output_schema: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> ValidationResult:
        """Validate an AI response and return the first failed stage."""

        try:
            schema_result = self.schema_validator.validate(response, output_schema)
            if not schema_result.is_valid:
                return schema_result

            business_result = self.business_validator.validate(
                schema_result.normalized_response,
                context,
            )
            if not business_result.is_valid:
                return business_result

            consistency_result = self.consistency_validator.validate(
                business_result.normalized_response,
                context,
            )
            if not consistency_result.is_valid:
                return consistency_result

            warnings = [
                *schema_result.warnings,
                *business_result.warnings,
                *consistency_result.warnings,
            ]
            return ValidationResult(
                is_valid=True,
                warnings=warnings,
                normalized_response=consistency_result.normalized_response,
            )
        except Exception as exc:
            return ValidationResult(
                is_valid=False,
                errors=[
                    ValidationIssue(
                        stage="validation",
                        code="validator_exception",
                        message=str(exc),
                    )
                ],
            )
