"""
Test Suite: AI Copilot LangGraph Orchestration & Verification.
Tests intent detection, selective context collection, RAG document retrieval,
prompt assembly, response validation, fallback execution, and the 5 mandatory queries.
"""
import unittest
import asyncio
from app.ai.graph.state import CopilotGraphState
from app.ai.graph.nodes import (
    planner_agent_node, context_collection_node, rag_retrieval_node,
    prompt_builder_node, response_validator_node, fallback_node
)
from app.ai.graph.workflow import workflow


class TestCopilotOrchestration(unittest.TestCase):

    def test_intent_detection(self):
        """Test Planner Agent intent detection across queries."""
        state1 = planner_agent_node(CopilotGraphState(user_query="Why is the risk score high?"))
        self.assertEqual(state1.intent, "risk_analysis")
        self.assertIn("risk", state1.required_engines)

        state2 = planner_agent_node(CopilotGraphState(user_query="Show safest procurement route"))
        self.assertEqual(state2.intent, "procurement_recommendation")
        self.assertIn("procurement", state2.required_engines)

        state3 = planner_agent_node(CopilotGraphState(user_query="How many days can SPR cover?"))
        self.assertEqual(state3.intent, "spr_strategy")
        self.assertIn("spr", state3.required_engines)

        state4 = planner_agent_node(CopilotGraphState(user_query="What is the economic impact?"))
        self.assertEqual(state4.intent, "economic_impact")
        self.assertIn("economic", state4.required_engines)

    def test_selective_context_collection(self):
        """Test Context Collection Node filters PipelineState sections based on required engines."""
        state = CopilotGraphState(user_query="Show safest procurement route")
        state = planner_agent_node(state)
        state = context_collection_node(state)

        ctx = state.pipeline_context
        self.assertIn("risk", ctx)
        self.assertIn("procurement", ctx)
        self.assertIn("compliance", ctx)

    def test_rag_document_retrieval(self):
        """Test RAG Retrieval Node retrieves top 5 relevant policy chunks."""
        state = CopilotGraphState(user_query="What are the OFAC sanctions directives?")
        state = planner_agent_node(state)
        state = rag_retrieval_node(state)

        self.assertGreater(len(state.retrieved_documents), 0)
        self.assertLessEqual(len(state.retrieved_documents), 5)
        sources = [d["source"] for d in state.retrieved_documents]
        self.assertTrue(any("Sanctions" in s or "Compliance" in s or "OPEC" in s for s in sources))

    def test_prompt_builder_grounding_constraints(self):
        """Test Prompt Builder Node injects strict grounding constraints."""
        state = CopilotGraphState(user_query="Show safest procurement route")
        state = planner_agent_node(state)
        state = context_collection_node(state)
        state = rag_retrieval_node(state)
        state = prompt_builder_node(state)

        sys_prompt = state.system_instruction
        self.assertIn("Answer ONLY using the supplied PIPELINE CONTEXT", sys_prompt)
        self.assertIn("NEVER invent numbers", sys_prompt)
        self.assertIn("Insufficient evidence", sys_prompt)

    def test_fallback_node_execution(self):
        """Test Fallback Node produces structured fallback response."""
        state = CopilotGraphState(user_query="Show safest procurement route")
        state = planner_agent_node(state)
        state = context_collection_node(state)
        state = fallback_node(state)

        self.assertTrue(state.fallback_used)
        resp = state.validated_response
        self.assertIsNotNone(resp)
        self.assertIn("summary", resp)
        self.assertIn("reasoning", resp)
        self.assertIn("evidence", resp)
        self.assertIn("confidence", resp)

    def test_5_mandatory_queries_end_to_end(self):
        """Test the 5 mandatory queries specified in Phase 5 verification instructions."""
        queries = [
            "Why is the risk score high?",
            "Show safest procurement route",
            "How many days can SPR cover?",
            "What is the economic impact?",
            "Why was West Africa selected?",
        ]

        async def _run_queries():
            for q in queries:
                res = await workflow.run(user_query=q)
                self.assertIsNotNone(res.validated_response)
                self.assertIn("summary", res.validated_response)
                self.assertIn("confidence", res.validated_response)

        asyncio.run(_run_queries())


if __name__ == "__main__":
    unittest.main()
