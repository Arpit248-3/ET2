"""
Reusable output schema templates for AI prompts.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

from app.ai.models.ai_models import AgentKind


OUTPUT_SCHEMAS: Dict[AgentKind, Dict[str, Any]] = {
    AgentKind.PLANNER: {
        "type": "object",
        "required": ["summary", "recommended_steps", "confidence"],
        "properties": {
            "summary": {"type": "string"},
            "recommended_steps": {"type": "array", "items": {"type": "string"}},
            "confidence": {"type": "number"},
        },
    },
    AgentKind.EXPLAINABILITY: {
        "type": "object",
        "required": ["summary", "drivers", "limitations"],
        "properties": {
            "summary": {"type": "string"},
            "drivers": {"type": "array", "items": {"type": "string"}},
            "limitations": {"type": "array", "items": {"type": "string"}},
        },
    },
    AgentKind.SPR: {
        "type": "object",
        "required": ["summary", "reserve_assessment", "watch_items"],
        "properties": {
            "summary": {"type": "string"},
            "reserve_assessment": {"type": "string"},
            "watch_items": {"type": "array", "items": {"type": "string"}},
        },
    },
    AgentKind.REDTEAM: {
        "type": "object",
        "required": ["critique", "weak_assumptions", "ignored_risks", "final_recommendation"],
        "properties": {
            "critique": {"type": "string"},
            "weak_assumptions": {"type": "array", "items": {"type": "string"}},
            "ignored_risks": {"type": "array", "items": {"type": "string"}},
            "final_recommendation": {"type": "string"},
        },
    },
    AgentKind.REPORT: {
        "type": "object",
        "required": ["title", "executive_summary", "sections"],
        "properties": {
            "title": {"type": "string"},
            "executive_summary": {"type": "string"},
            "sections": {"type": "array", "items": {"type": "object"}},
        },
    },
    AgentKind.COPILOT: {
        "type": "object",
        "required": ["answer", "referenced_context", "next_actions"],
        "properties": {
            "answer": {"type": "string"},
            "referenced_context": {"type": "array", "items": {"type": "string"}},
            "next_actions": {"type": "array", "items": {"type": "string"}},
        },
    },
}


def get_output_schema(agent: AgentKind | str) -> Dict[str, Any]:
    """Return a copy of the default output schema for an agent."""

    return deepcopy(OUTPUT_SCHEMAS[AgentKind(agent)])
