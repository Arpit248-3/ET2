"""
Unit Test Suite for Phase 6 — Multi-Agent Reasoning Architecture.
Tests Explainability Agent, Red Team Agent, Executive Report Agent, Comparison Agent,
What-If Agent, Confidence Review Agent, Prompt Registry, and Chain of Evidence.
"""
import unittest
import asyncio
from app.ai.prompts.prompt_registry import get_prompt_record, PROMPT_REGISTRY
from app.ai.agents import (
    run_explainability_agent,
    run_redteam_agent,
    run_report_agent,
    run_comparison_agent,
    run_whatif_agent,
    run_confidence_review_agent,
)
from app.ai.graph.multi_agent_workflow import multi_agent_orchestrator
from app.pipeline.controller import controller
from app.pipeline.models import ExecutionContext
from app.pipeline.serializer import serialize


class TestPhase6MultiAgentArchitecture(unittest.TestCase):

    def setUp(self):
        ctx = ExecutionContext(scenario_id="hormuz_closure", trigger="TEST")
        state = controller.run(context=ctx)
        self.pipeline_dict = serialize(state)
        self.rag_docs = [
            {"source": "OPEC_Report_2025", "title": "OPEC Production Cut Report"},
            {"source": "OFAC_Directive", "title": "OFAC SDN Sanctions Directive"}
        ]

    def test_prompt_registry_versioning(self):
        """Test prompt registry returns versioned PromptRecord objects."""
        rec = get_prompt_record("explainability")
        self.assertEqual(rec.version, "1.0.0")
        self.assertEqual(rec.author, "UrjaNetra AI Core Team")
        self.assertIn("Explainability Agent", rec.system_prompt)
        self.assertGreater(len(PROMPT_REGISTRY), 5)

    def test_explainability_agent(self):
        """Test Explainability Agent produces grounded reasons, evidence, and counterfactuals."""
        res = asyncio.run(run_explainability_agent(self.pipeline_dict, self.rag_docs))
        self.assertIn("summary", res)
        self.assertGreater(len(res["primary_reasons"]), 0)
        self.assertGreater(len(res["supporting_evidence"]), 0)
        self.assertIn("counterfactual", res)
        self.assertIn("chain_of_evidence", res)

    def test_redteam_agent_critique(self):
        """Test Red Team Agent adversarially critiques recommendations."""
        res = asyncio.run(run_redteam_agent(self.pipeline_dict, self.rag_docs, "Procure West Africa crude"))
        self.assertIn("overall_assessment", res)
        self.assertGreater(len(res["weaknesses"]), 0)
        self.assertGreater(len(res["blind_spots"]), 0)
        self.assertIn("confidence_adjusted", res)
        self.assertIn(res["approval_recommendation"], ["APPROVE", "CONDITIONAL", "REJECT"])

    def test_report_agent_decision_brief(self):
        """Test Executive Report Agent generates structured minister-level briefs."""
        res = asyncio.run(run_report_agent(self.pipeline_dict, self.rag_docs))
        self.assertIn("situation_overview", res)
        self.assertIn("key_risks", res)
        self.assertIn("economic_impact", res)
        self.assertIn("recommended_action", res)
        self.assertIn("decision_required", res)

    def test_comparison_agent(self):
        """Test Strategy Comparison Agent compares multiple procurement options."""
        res = asyncio.run(run_comparison_agent(self.pipeline_dict, self.rag_docs))
        self.assertIn("comparison_matrix", res)
        self.assertGreater(len(res["comparison_matrix"]), 0)
        self.assertIn("overall_recommendation", res)

    def test_whatif_agent_simulation_delta(self):
        """Test What-If Agent executes deterministic simulation and explains deltas."""
        res = asyncio.run(run_whatif_agent(self.pipeline_dict, "What if delay increases by 20%?", "hormuz_closure"))
        self.assertIn("delta_summary", res)
        self.assertIn("risk_delta", res)
        self.assertIn("economic_delta", res)
        self.assertIn("spr_delta", res)

    def test_confidence_review_agent(self):
        """Test Confidence Review Agent evaluates engine confidence breakdown."""
        res = asyncio.run(run_confidence_review_agent(self.pipeline_dict, self.rag_docs))
        self.assertIn("overall_confidence", res)
        self.assertIn("high_confidence_reasons", res)
        self.assertIn("data_quality_score", res)

    def test_multi_agent_workflow_orchestrator(self):
        """Test MultiAgentWorkflow orchestrator routes queries and embeds internal trace."""
        res = asyncio.run(multi_agent_orchestrator.execute("explainability", "Why West Africa?", "hormuz_closure"))
        self.assertIn("trace", res)
        self.assertIn("trc-", res["trace"]["trace_id"])
        self.assertEqual(res["trace"]["scenario_id"], "hormuz_closure")


if __name__ == "__main__":
    unittest.main()
