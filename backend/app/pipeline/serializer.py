"""
State Serializer — JSON serialization, deserialization, deep copy, and diff generation.
"""
import copy
import json
from typing import Any, Dict, Optional


def serialize(state: Any) -> Dict:
    """Convert a PipelineState Pydantic model to a plain JSON-serializable dict."""
    return json.loads(state.model_dump_json())


def deserialize(data: Dict, model_class: Any) -> Any:
    """Reconstruct a PipelineState from a plain dict."""
    return model_class(**data)


def deep_copy(state: Any) -> Any:
    """Return a deep copy of a PipelineState."""
    return state.model_copy(deep=True)


def diff(state_a: Any, state_b: Any) -> Dict:
    """
    Generate a structured diff between two PipelineState versions.
    Returns a dict of {section: {field: {from: v1, to: v2}}} entries.
    """
    dict_a = serialize(state_a)
    dict_b = serialize(state_b)
    return _deep_diff(dict_a, dict_b, path="")


def _deep_diff(a: Any, b: Any, path: str) -> Dict:
    changes = {}

    if isinstance(a, dict) and isinstance(b, dict):
        all_keys = set(a.keys()) | set(b.keys())
        for key in all_keys:
            sub_path = f"{path}.{key}" if path else key
            val_a = a.get(key)
            val_b = b.get(key)
            if val_a != val_b:
                sub_diff = _deep_diff(val_a, val_b, sub_path)
                if sub_diff:
                    changes.update(sub_diff)
                else:
                    changes[sub_path] = {"from": val_a, "to": val_b}
    elif isinstance(a, list) and isinstance(b, list):
        if a != b:
            changes[path] = {"from": a, "to": b}
    else:
        if a != b:
            changes[path] = {"from": a, "to": b}

    return changes
