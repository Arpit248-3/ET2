import json
import unittest

import httpx

from app.ai.config import AIConfig
from app.ai.models.ai_models import AgentKind, AICompletionRequest, AIMessage, ModelRole
from app.ai.services.openrouter_client import OpenRouterClient


class OpenRouterClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_complete_uses_configured_model_and_parses_json_without_network(self):
        captured = {}

        async def handler(request):
            captured["authorization"] = request.headers.get("Authorization")
            captured["payload"] = json.loads(request.content.decode("utf-8"))
            return httpx.Response(
                200,
                json={
                    "choices": [
                        {"message": {"content": json.dumps({"answer": "ok"})}}
                    ],
                    "usage": {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3},
                },
            )

        config = AIConfig(
            base_url="https://openrouter.test/api/v1",
            api_key="test-secret",
            model_copilot="model-from-env-copilot",
            model_explain="model-from-env-explain",
            model_redteam="model-from-env-redteam",
            model_report="model-from-env-report",
            model_spr="model-from-env-spr",
            timeout=5,
            max_retries=0,
            temperature=0.2,
            top_p=0.9,
        )
        http_client = httpx.AsyncClient(
            base_url=config.base_url,
            transport=httpx.MockTransport(handler),
        )
        client = OpenRouterClient(config=config, http_client=http_client)

        response = await client.complete(
            AICompletionRequest(
                agent=AgentKind.COPILOT,
                model_role=ModelRole.COPILOT,
                messages=[
                    AIMessage(role="system", content="Return JSON."),
                    AIMessage(role="user", content="Hello"),
                ],
            )
        )
        await http_client.aclose()

        self.assertEqual(response.parsed_json, {"answer": "ok"})
        self.assertEqual(response.selected_model, "model-from-env-copilot")
        self.assertEqual(captured["authorization"], "Bearer test-secret")
        self.assertEqual(captured["payload"]["model"], "model-from-env-copilot")
        self.assertEqual(captured["payload"]["response_format"], {"type": "json_object"})


if __name__ == "__main__":
    unittest.main()
