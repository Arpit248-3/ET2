import json
import unittest

from app.ai.models.ai_models import AgentKind, AICompletionResponse, ModelRole
from app.ai.services.ai_service import AIService


class MockOpenRouterClient:
    def __init__(self, payload):
        self.payload = payload
        self.requests = []

    async def complete(self, request):
        self.requests.append(request)
        return AICompletionResponse(
            request_id=request.request_id,
            agent=request.agent,
            selected_model="model-from-mock-client",
            content=json.dumps(self.payload),
            parsed_json=self.payload,
            latency_ms=7.5,
            retries=1,
        )


class AIServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_service_initializes_with_mock_client_and_generates_explanation(self):
        mock_client = MockOpenRouterClient(
            {
                "summary": "Risk rose because route exposure increased.",
                "drivers": ["Route disruption"],
                "limitations": ["Mock response"],
            }
        )
        service = AIService(openrouter_client=mock_client)

        result = await service.generate_explanation(
            user_query="Explain the risk movement.",
            context_inputs={"risk": {"overall_score": 74}},
            conversation_id="conv-1",
        )

        self.assertTrue(result.success)
        self.assertEqual(result.agent, AgentKind.EXPLAINABILITY)
        self.assertEqual(mock_client.requests[0].model_role, ModelRole.EXPLAIN)
        self.assertEqual(result.metadata["selected_model"], "model-from-mock-client")
        memory = service.memory.snapshot("conv-1")
        self.assertEqual(memory["previous_requests"][0]["query"], "Explain the risk movement.")

    async def test_service_returns_validation_error_without_crashing(self):
        mock_client = MockOpenRouterClient({"summary": 12})
        service = AIService(openrouter_client=mock_client)

        result = await service.generate_explanation(
            user_query="Explain.",
            context_inputs={"risk": {"overall_score": 74}},
        )

        self.assertFalse(result.success)
        self.assertEqual(result.error["error_type"], "AI_VALIDATION_ERROR")


if __name__ == "__main__":
    unittest.main()
