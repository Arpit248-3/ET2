"""
Test Suite: Determinism & Replayability
"""
import unittest
from app.pipeline.controller import controller
from app.pipeline.models import ExecutionContext
from app.pipeline.serializer import serialize


class TestDeterminism(unittest.TestCase):

    def test_pipeline_determinism_single_scenario(self):
        """Verify two runs with identical inputs produce identical output hashes and values."""
        ctx1 = ExecutionContext(scenario_id="hormuz_closure", demo_step=1, trigger="TEST_DETERMINISM")
        state1 = controller.run(context=ctx1)

        ctx2 = ExecutionContext(scenario_id="hormuz_closure", demo_step=1, trigger="TEST_DETERMINISM")
        state2 = controller.run(context=ctx2)

        # Risk Engine determinism
        self.assertEqual(state1.risk.overall_score, state2.risk.overall_score)
        self.assertEqual(state1.risk.calculation_metadata.output_hash, state2.risk.calculation_metadata.output_hash)

        # Economic Engine determinism
        self.assertEqual(state1.economic.import_bill_usd_bn, state2.economic.import_bill_usd_bn)
        self.assertEqual(state1.economic.calculation_metadata.output_hash, state2.economic.calculation_metadata.output_hash)

        # Procurement Engine determinism
        self.assertEqual(len(state1.procurement.recommended_mix), len(state2.procurement.recommended_mix))
        self.assertEqual(state1.procurement.recommended_mix[0].composite_score, state2.procurement.recommended_mix[0].composite_score)

        # SPR Engine determinism
        self.assertEqual(state1.spr.reserve_after_action_mbbl, state2.spr.reserve_after_action_mbbl)
        self.assertEqual(state1.spr.calculation_metadata.output_hash, state2.spr.calculation_metadata.output_hash)

        # Executive Engine overall confidence determinism
        self.assertEqual(state1.overall_confidence, state2.overall_confidence)

    def test_pipeline_replay_all_scenarios(self):
        """Verify replay determinism across multiple scenarios."""
        scenarios = ["hormuz_closure", "opec_cut", "russia_sanctions", "bab_el_mandeb_blockade", "cyclone_biparjoy_gujarat"]
        for sc_id in scenarios:
            c1 = ExecutionContext(scenario_id=sc_id, demo_step=0, trigger="REPLAY")
            s1 = controller.run(context=c1)

            c2 = ExecutionContext(scenario_id=sc_id, demo_step=0, trigger="REPLAY")
            s2 = controller.run(context=c2)

            dict1 = serialize(s1)
            dict2 = serialize(s2)

            # Ignore non-deterministic metadata execution_id and timestamps
            dict1["metadata"]["execution_id"] = "fixed"
            dict2["metadata"]["execution_id"] = "fixed"
            dict1["metadata"]["timestamp"] = "fixed"
            dict2["metadata"]["timestamp"] = "fixed"
            dict1["executive"]["timestamp"] = "fixed"
            dict2["executive"]["timestamp"] = "fixed"

            # Normalize timing & dynamic timestamps for exact structure comparison
            for sec in ("risk", "economic", "procurement", "compatibility", "spr", "compliance", "decision", "executive"):
                if sec in dict1 and "timestamp" in dict1[sec]:
                    dict1[sec]["timestamp"] = "fixed"
                    dict2[sec]["timestamp"] = "fixed"
                if sec in dict1 and "calculation_metadata" in dict1[sec] and dict1[sec]["calculation_metadata"]:
                    dict1[sec]["calculation_metadata"]["execution_time_ms"] = 0.0
                    dict2[sec]["calculation_metadata"]["execution_time_ms"] = 0.0

            self.assertEqual(dict1["risk"], dict2["risk"])
            self.assertEqual(dict1["economic"], dict2["economic"])
            self.assertEqual(dict1["compliance"], dict2["compliance"])


if __name__ == "__main__":
    unittest.main()
