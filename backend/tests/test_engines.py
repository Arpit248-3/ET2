"""
Test Suite: Engine Business Rules & Boundary Conditions
"""
import unittest
from app.core import (
    risk_engine, economic_engine, procurement_engine,
    compatibility_engine, spr_engine, compliance_engine, decision_engine
)


class TestEngines(unittest.TestCase):

    def test_sanctions_exclusion_in_procurement_and_compliance(self):
        """Verify Russian suppliers are blocked and assigned 0.0 composite score when sanctions are active."""
        raw_proc = procurement_engine.optimize_procurement("russia_sanctions", demo_step=0)
        russia_sup = next(s for s in raw_proc["recommended_mix"] if s["country"] == "Russia")

        self.assertTrue(russia_sup["sanctions_status"].startswith("BLOCKED"))
        self.assertEqual(russia_sup["composite_score"], 0.0)
        self.assertEqual(russia_sup["recommended_volume_mbbl"], 0.0)

        raw_comp = compliance_engine.evaluate_compliance("russia_sanctions", demo_step=0)
        self.assertEqual(raw_comp["status_level"], "RED")
        self.assertGreaterEqual(raw_comp["flagged_count"], 1)
        self.assertFalse(raw_comp["all_clear"])

    def test_spr_capacity_limits(self):
        """Verify SPR drawdown allocation never causes negative inventory or exceeds total capacity."""
        raw_spr = spr_engine.plan_spr(daily_gap_mbbl=3.5, days_until_cargo_arrival=10)
        self.assertGreaterEqual(raw_spr["reserve_after_action_mbbl"], 0.0)
        self.assertGreaterEqual(raw_spr["reserve_after_action_pct"], 0.0)
        self.assertLessEqual(raw_spr["reserve_after_action_pct"], 100.0)
        self.assertEqual(len(raw_spr["sites"]), 3)

    def test_refinery_compatibility_penalties(self):
        """Verify high-sulfur crude incurs refining penalty."""
        comp_arab = compatibility_engine.calculate_compatibility("Arab Light")  # 1.97% Sulfur
        comp_murban = compatibility_engine.calculate_compatibility("Murban")      # 0.78% Sulfur

        self.assertGreaterEqual(comp_arab["refining_cost_penalty_usd"], comp_murban["refining_cost_penalty_usd"])

    def test_dynamic_risk_weights(self):
        """Verify threat component weights dynamically shift based on scenario category."""
        w_hormuz = risk_engine._get_dynamic_weights("hormuz_closure")
        w_cyber = risk_engine._get_dynamic_weights("cyberattack_pipeline_scada")
        w_cyclone = risk_engine._get_dynamic_weights("cyclone_biparjoy_gujarat")

        self.assertGreater(w_hormuz["maritime_delay"], w_hormuz["cyber_threat"])
        self.assertGreater(w_cyber["cyber_threat"], w_cyber["weather_severity"])
        self.assertGreater(w_cyclone["weather_severity"], w_cyclone["geopolitical_threat"])


if __name__ == "__main__":
    unittest.main()
