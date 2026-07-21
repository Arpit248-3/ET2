# UrjaNetra AI - AI Developer Guide

## Adding a Future AI Endpoint

1. Keep the endpoint thin.
2. Gather deterministic engine outputs using existing services.
3. Pass those outputs to `AIService` as `context_inputs`.
4. Return `AIServiceResult` or map it to an endpoint schema.
5. Do not import or instantiate `OpenRouterClient` in routers.

Example shape:

```python
from app.ai.services.ai_service import AIService

ai_service = AIService()

result = await ai_service.generate_explanation(
    user_query=request.question,
    context_inputs={
        "scenario": scenario,
        "risk": risk_result,
        "economic": economic_result,
    },
    conversation_id=request.conversation_id,
)
```

## Adding a New Agent

Create a small facade in `app/ai/agents`. The agent should accept an
`AIService` instance and delegate to a public service method. Agents must not
call OpenRouter directly.

## Adding a New Output Schema

Add a schema to `app/ai/prompts/templates.py`. Keep it JSON-compatible and
small enough for `SchemaValidator` to validate. The current validator supports:

- `object`
- `array`
- `string`
- `number`
- `integer`
- `boolean`
- `null`
- `required`
- `properties`
- `items`

## Configuration

Create `backend/.env` locally with the required `OPENROUTER_*` values. Do not
commit real `.env` files. The repository `.gitignore` already excludes them.

## Testing

AI tests use mocked clients and make no real API calls.

```bash
cd backend
python -m unittest discover -s tests -v
python -m compileall app
```

## Logging

Use `AIRequestLogger` for AI events. Logs include timestamp, request id, agent,
selected model, latency, retries, validation result, and errors. API keys,
authorization headers, tokens, and secrets are redacted.
