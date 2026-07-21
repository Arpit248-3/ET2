# AI Package Folder Guide

`app/ai` is the reusable AI infrastructure layer for UrjaNetra AI. It is
isolated from existing deterministic engines and current API routes.

## Folders

`services/`

- `ai_service.py`: single entry point for AI orchestration.
- `openrouter_client.py`: provider-specific OpenRouter transport.
- `context_builder.py`: normalizes backend outputs into JSON context.
- `prompt_builder.py`: assembles model-agnostic prompts.
- `response_validator.py`: runs schema, business, and consistency validation.

`agents/`

- Placeholder facades for planner, explainability, SPR, red team, report, and
  copilot workflows.
- Agents delegate to `AIService` and never call OpenRouter directly.

`prompts/`

- `system_prompts.py`: system prompt registry by agent.
- `templates.py`: default output schemas by agent.

`validators/`

- `schema_validator.py`: lightweight JSON-schema subset validation.
- `business_validator.py`: future domain validation boundary.
- `consistency_validator.py`: future cross-field validation boundary.

`memory/`

- `session_memory.py`: replaceable in-memory conversation state.

`rag/`

- `loader.py`, `retriever.py`, and `embeddings.py`: Phase 4 interfaces with
  TODO markers and no external embedding calls.

`models/`

- `ai_models.py`: shared Pydantic request, response, prompt, validation, and
  memory contracts.

## Additional Root Modules

- `config.py`: `.env` configuration loading and validation.
- `exceptions.py`: structured AI exceptions.
- `logging.py`: sanitized structured AI request logging.
