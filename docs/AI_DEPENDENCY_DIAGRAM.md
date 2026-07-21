# UrjaNetra AI - AI Dependency Diagram

## Package Dependencies

```mermaid
flowchart LR
    Models["app.ai.models"] --> Config["app.ai.config"]
    Models --> Prompts["app.ai.prompts"]
    Models --> Builders["app.ai.services builders"]
    Models --> Validators["app.ai.validators"]
    Models --> Memory["app.ai.memory"]
    Models --> RAG["app.ai.rag"]

    Config --> Client["OpenRouterClient"]
    Prompts --> PromptBuilder["PromptBuilder"]
    Validators --> ResponseValidator["ResponseValidator"]

    ContextBuilder["ContextBuilder"] --> AIService["AIService"]
    PromptBuilder --> AIService
    ResponseValidator --> AIService
    RAG --> AIService
    Memory --> AIService
    Client --> AIService

    AIService --> Agents["app.ai.agents"]
```

## Dependency Rules

- Agents depend on `AIService`, never on `OpenRouterClient`.
- Future endpoints should depend on `AIService`, never on `OpenRouterClient`.
- `OpenRouterClient` depends on configuration and HTTP transport only.
- Builders and validators depend on shared AI models, not on provider clients.
- RAG components are placeholders and do not call external embedding services.
- The existing `app.core` engines remain independent of the AI package.

## Provider Boundary

```mermaid
sequenceDiagram
    participant Feature as Future Feature
    participant Service as AIService
    participant Prompt as PromptBuilder
    participant Client as OpenRouterClient
    participant Provider as OpenRouter
    participant Validator as ResponseValidator

    Feature->>Service: request AI output
    Service->>Prompt: build provider-neutral prompt
    Service->>Client: complete(AICompletionRequest)
    Client->>Provider: /chat/completions
    Provider-->>Client: response
    Client-->>Service: AICompletionResponse
    Service->>Validator: validate response
    Validator-->>Service: ValidationResult
    Service-->>Feature: AIServiceResult
```
