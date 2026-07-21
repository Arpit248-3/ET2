"""
Context normalization for AI workflows.

ContextBuilder collects deterministic backend outputs and returns a normalized
JSON-compatible object. It does not create prompts or call models.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel


class ContextBuilder:
    """Build normalized AI context from backend engine outputs."""

    CONTEXT_KEYS = (
        "scenario",
        "risk",
        "economic",
        "procurement",
        "spr",
        "compliance",
        "timeline",
        "decision",
    )

    def build_context(
        self,
        *,
        scenario: Optional[Any] = None,
        risk: Optional[Any] = None,
        economic: Optional[Any] = None,
        procurement: Optional[Any] = None,
        spr: Optional[Any] = None,
        compliance: Optional[Any] = None,
        timeline: Optional[Any] = None,
        decision: Optional[Any] = None,
        extras: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Return normalized context for prompt assembly."""

        source_values = {
            "scenario": scenario,
            "risk": risk,
            "economic": economic,
            "procurement": procurement,
            "spr": spr,
            "compliance": compliance,
            "timeline": timeline,
            "decision": decision,
        }
        context = {
            "scenario": self._normalize(scenario),
            "risk": self._normalize(risk),
            "economic": self._normalize(economic),
            "procurement": self._normalize(procurement),
            "spr": self._normalize(spr),
            "compliance": self._normalize(compliance),
            "timeline": self._normalize(timeline),
            "decision": self._normalize(decision),
            "metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "available_sections": [
                    key
                    for key in self.CONTEXT_KEYS
                    if source_values.get(key) is not None
                ],
            },
        }
        if extras:
            context["extras"] = self._normalize(extras)
        return context

    def from_pipeline_state(self, pipeline_state: Dict[str, Any]) -> Dict[str, Any]:
        """Build context from the existing pipeline state response shape."""

        return self.build_context(
            scenario=pipeline_state.get("active_scenario"),
            risk=pipeline_state.get("risk"),
            economic=pipeline_state.get("economic"),
            procurement=pipeline_state.get("procurement"),
            spr=pipeline_state.get("spr"),
            compliance=pipeline_state.get("compliance"),
            timeline=pipeline_state.get("timeline"),
            decision=pipeline_state.get("latest_decision"),
            extras={
                "state": pipeline_state.get("state"),
                "demo": pipeline_state.get("demo"),
                "notifications": pipeline_state.get("notifications"),
                "audit_summary": pipeline_state.get("audit_summary"),
                "generated_at": pipeline_state.get("generated_at"),
            },
        )

    def _normalize(self, value: Any) -> Any:
        """Convert common backend objects into JSON-compatible values."""

        if value is None:
            return None
        if isinstance(value, BaseModel):
            return value.model_dump(mode="json")
        if isinstance(value, dict):
            return {str(key): self._normalize(item) for key, item in value.items()}
        if isinstance(value, (list, tuple, set)):
            return [self._normalize(item) for item in value]
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        return value
