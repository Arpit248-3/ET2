"""
Lightweight JSON-schema validation for AI responses.

This validator implements the subset needed for initial infrastructure tests
and can be replaced by a full JSON Schema engine later.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.ai.models.ai_models import ValidationIssue, ValidationResult


class SchemaValidator:
    """Validate AI responses against the configured output schema."""

    TYPE_MAP = {
        "object": dict,
        "array": list,
        "string": str,
        "number": (int, float),
        "integer": int,
        "boolean": bool,
        "null": type(None),
    }

    def validate(self, response: Any, output_schema: Optional[Dict[str, Any]] = None) -> ValidationResult:
        """Return schema validation result without raising on invalid responses."""

        if not output_schema:
            normalized = response if isinstance(response, dict) else {"value": response}
            return ValidationResult(is_valid=True, normalized_response=normalized)

        errors: List[ValidationIssue] = []
        self._validate_node(response, output_schema, "$", errors)
        return ValidationResult(
            is_valid=not errors,
            errors=errors,
            normalized_response=response if isinstance(response, dict) and not errors else None,
        )

    def _validate_node(
        self,
        value: Any,
        schema: Dict[str, Any],
        path: str,
        errors: List[ValidationIssue],
    ) -> None:
        expected_type = schema.get("type")
        if expected_type and not self._matches_type(value, expected_type):
            errors.append(
                ValidationIssue(
                    stage="schema",
                    code="type_mismatch",
                    message=f"Expected {expected_type}.",
                    path=path,
                )
            )
            return

        if expected_type == "object":
            self._validate_object(value, schema, path, errors)
        elif expected_type == "array" and isinstance(value, list):
            item_schema = schema.get("items")
            if isinstance(item_schema, dict):
                for index, item in enumerate(value):
                    self._validate_node(item, item_schema, f"{path}[{index}]", errors)

    def _validate_object(
        self,
        value: Any,
        schema: Dict[str, Any],
        path: str,
        errors: List[ValidationIssue],
    ) -> None:
        if not isinstance(value, dict):
            return

        for required_key in schema.get("required", []):
            if required_key not in value:
                errors.append(
                    ValidationIssue(
                        stage="schema",
                        code="required_missing",
                        message=f"Missing required field '{required_key}'.",
                        path=f"{path}.{required_key}",
                    )
                )

        properties = schema.get("properties", {})
        for key, child_schema in properties.items():
            if key in value and isinstance(child_schema, dict):
                self._validate_node(value[key], child_schema, f"{path}.{key}", errors)

    def _matches_type(self, value: Any, expected_type: str) -> bool:
        """Return whether a Python value matches a JSON schema type."""

        expected_python_type = self.TYPE_MAP.get(expected_type)
        if expected_python_type is None:
            return True
        if expected_type == "number" and isinstance(value, bool):
            return False
        if expected_type == "integer" and isinstance(value, bool):
            return False
        return isinstance(value, expected_python_type)
