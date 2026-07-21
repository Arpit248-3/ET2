"""
Scenario Engine — loads and manages scenario packs from JSON files.
Acts as the single source of truth for scenario state.
"""
import json
import os
from typing import Optional, Dict, Any, List, TYPE_CHECKING

SCENARIOS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "scenarios")
REFERENCE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "reference")

# In-memory cache of loaded scenarios
_scenario_cache: Dict[str, Dict] = {}
_reference_cache: Dict[str, Any] = {}


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_all_scenarios() -> List[Dict]:
    """Load all scenario JSON files from the scenarios directory."""
    global _scenario_cache
    if not _scenario_cache:
        for filename in os.listdir(SCENARIOS_DIR):
            if filename.endswith(".json"):
                path = os.path.join(SCENARIOS_DIR, filename)
                data = _load_json(path)
                _scenario_cache[data["id"]] = data
    return list(_scenario_cache.values())


def get_scenario(scenario_id: str) -> Optional[Dict]:
    """Get a specific scenario by ID."""
    get_all_scenarios()  # ensure cache is warm
    return _scenario_cache.get(scenario_id)


def get_reference(name: str) -> Any:
    """Load a reference JSON file (suppliers, refineries, etc.)."""
    global _reference_cache
    if name not in _reference_cache:
        path = os.path.join(REFERENCE_DIR, f"{name}.json")
        _reference_cache[name] = _load_json(path)
    return _reference_cache[name]


def get_suppliers() -> List[Dict]:
    return get_reference("suppliers")


def get_refineries() -> List[Dict]:
    return get_reference("refineries")


def get_spr_sites() -> List[Dict]:
    return get_reference("spr_sites")


def get_thresholds() -> Dict:
    return get_reference("thresholds")


def invalidate_reference_cache():
    """Force reload of reference data (used after threshold updates)."""
    global _reference_cache
    _reference_cache = {}


def reload_scenarios():
    """Invalidate scenario cache to pick up newly uploaded scenarios."""
    global _scenario_cache
    _scenario_cache = {}
    get_all_scenarios()


def execute(state: Any, context: Any) -> Any:
    """
    Execute Scenario Engine. Reads active scenario ID from context,
    populates state.scenario, and updates scenario metadata.
    """
    scenario_id = context.scenario_id
    if scenario_id:
        scenario_data = get_scenario(scenario_id) or {}
    else:
        scenario_data = {}

    state.scenario = scenario_data
    state.metadata.scenario_id = scenario_id
    state.metadata.demo_step = context.demo_step
    return state


