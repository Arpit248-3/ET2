"""
Test Suite: Scenario Pack Suite Runner
"""
import unittest
from app.core.scenario_engine import get_all_scenarios
from app.pipeline.controller import controller
from app.pipeline.models import ExecutionContext


class TestScenarioSuite(unittest.TestCase):

    def test_execute_all_15_scenarios(self):
        """Run pipeline across all 15 scenario packs and verify zero exceptions."""
        all_scenarios = get_all_scenarios()
        self.assertGreaterEqual(len(all_scenarios), 15)

        for scenario in all_scenarios:
            sc_id = scenario["id"]
            ctx = ExecutionContext(scenario_id=sc_id, demo_step=1, trigger="SUITE_TEST")
            state = controller.run(context=ctx)

            # Assert PipelineState integrity
            self.assertEqual(state.metadata.scenario_id, sc_id)
            self.assertTrue(0 <= state.risk.overall_score <= 100)
            self.assertGreater(state.economic.import_bill_usd_bn, 0)
            self.assertGreater(len(state.procurement.recommended_mix), 0)
            self.assertGreaterEqual(state.spr.reserve_after_action_mbbl, 0)
            self.assertGreater(state.overall_confidence, 0.0)

            # Assert Explanation & Calculation Metadata presence
            self.assertIsNotNone(state.risk.explanation_metadata)
            self.assertIsNotNone(state.risk.calculation_metadata)
            self.assertIsNotNone(state.economic.explanation_metadata)
            self.assertIsNotNone(state.procurement.explanation_metadata)
            self.assertIsNotNone(state.compliance.explanation_metadata)
            self.assertIsNotNone(state.decision.explanation_metadata)
            self.assertIsNotNone(state.executive.explanation_metadata)


if __name__ == "__main__":
    unittest.main()
