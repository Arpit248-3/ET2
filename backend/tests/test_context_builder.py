from datetime import datetime, timezone
import unittest

from pydantic import BaseModel

from app.ai.services.context_builder import ContextBuilder


class SampleRisk(BaseModel):
    overall_score: int
    trend: str


class ContextBuilderTests(unittest.TestCase):
    def test_build_context_normalizes_backend_outputs(self):
        builder = ContextBuilder()

        context = builder.build_context(
            scenario={"id": "hormuz_closure"},
            risk=SampleRisk(overall_score=74, trend="UP"),
            timeline=[{"timestamp": datetime(2026, 7, 20, tzinfo=timezone.utc)}],
        )

        self.assertEqual(context["scenario"]["id"], "hormuz_closure")
        self.assertEqual(context["risk"]["overall_score"], 74)
        self.assertEqual(context["timeline"][0]["timestamp"], "2026-07-20T00:00:00+00:00")
        self.assertIn("scenario", context["metadata"]["available_sections"])
        self.assertIn("risk", context["metadata"]["available_sections"])

    def test_from_pipeline_state_maps_existing_pipeline_shape(self):
        builder = ContextBuilder()

        context = builder.from_pipeline_state(
            {
                "active_scenario": {"id": "opec_cut"},
                "risk": {"overall_score": 62},
                "economic": {"summary": "impact"},
                "procurement": {"recommended_mix": []},
                "spr": {"coverage_days": 22},
                "compliance": {"all_clear": True},
                "timeline": {"events": []},
                "latest_decision": {"status": "PENDING"},
                "state": {"kpi": {}},
            }
        )

        self.assertEqual(context["scenario"]["id"], "opec_cut")
        self.assertEqual(context["decision"]["status"], "PENDING")
        self.assertEqual(context["extras"]["state"]["kpi"], {})


if __name__ == "__main__":
    unittest.main()
