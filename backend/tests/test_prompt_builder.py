import unittest

from app.ai.models.ai_models import AgentKind, KnowledgeChunk
from app.ai.prompts.templates import get_output_schema
from app.ai.services.prompt_builder import PromptBuilder


class PromptBuilderTests(unittest.TestCase):
    def test_prompt_contains_system_context_knowledge_query_and_schema(self):
        builder = PromptBuilder()
        schema = get_output_schema(AgentKind.COPILOT)

        prompt = builder.build_prompt(
            agent=AgentKind.COPILOT,
            context={"risk": {"overall_score": 74}},
            user_query="What changed?",
            output_schema=schema,
            retrieved_knowledge=[
                KnowledgeChunk(id="policy-1", source="manual", content="Use approved context only.")
            ],
        )

        self.assertEqual(prompt.messages[0].role, "system")
        self.assertEqual(prompt.messages[1].role, "user")
        user_content = prompt.messages[1].content
        self.assertIn("Context JSON:", user_content)
        self.assertIn('"overall_score": 74', user_content)
        self.assertIn("Retrieved Knowledge:", user_content)
        self.assertIn("policy-1", user_content)
        self.assertIn("What changed?", user_content)
        self.assertIn("Output Schema:", user_content)


if __name__ == "__main__":
    unittest.main()
