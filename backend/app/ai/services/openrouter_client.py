"""
Reusable OpenRouter client.

The client owns provider-specific concerns: configuration loading, model role
selection, connection pooling, retries, timeout handling, streaming, structured
JSON responses, error mapping, and sanitized logging.
"""

from __future__ import annotations

import asyncio
import json
from time import perf_counter
from typing import Any, AsyncIterator, Dict, Optional

import httpx

from app.ai.config import AIConfig
from app.ai.exceptions import AIConnectionError, AIResponseError, AITimeoutError, ConfigurationError
from app.ai.logging import AIRequestLogger
from app.ai.models.ai_models import AICompletionRequest, AICompletionResponse, AIUsage


class OpenRouterClient:
    """OpenRouter chat-completions client used by AIService only."""

    CHAT_COMPLETIONS_PATH = "/chat/completions"
    RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

    def __init__(
        self,
        *,
        config: Optional[AIConfig] = None,
        config_path: Optional[str] = None,
        http_client: Optional[httpx.AsyncClient] = None,
        logger: Optional[AIRequestLogger] = None,
    ) -> None:
        self.config = config or AIConfig.from_env_file(config_path)
        self.logger = logger or AIRequestLogger()
        self._owns_client = http_client is None
        self._client = http_client or httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=httpx.Timeout(self.config.timeout),
            limits=httpx.Limits(),
        )

    def _request_headers(self, request: AICompletionRequest) -> Dict[str, str]:
        api_key = self.config.api_key_for_role(request.model_role)
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def complete(self, request: AICompletionRequest) -> AICompletionResponse:
        """Send one non-streaming chat completion request to OpenRouter."""

        selected_model = self.config.model_for_role(request.model_role)
        payload = self._build_payload(request, selected_model, stream=False)
        start = perf_counter()
        retries = 0

        for attempt in range(self.config.max_retries + 1):
            try:
                response = await self._client.post(
                    self.CHAT_COMPLETIONS_PATH,
                    json=payload,
                    headers=self._request_headers(request),
                )
                if self._should_retry(response.status_code, attempt):
                    retries += 1
                    await asyncio.sleep(self._retry_delay(attempt))
                    continue

                response.raise_for_status()
                body = response.json()
                completion = self._parse_completion_body(body, request, selected_model, start, retries)
                self.logger.log_event(
                    event="openrouter.complete",
                    request_id=request.request_id,
                    agent=request.agent.value,
                    selected_model=selected_model,
                    latency_ms=completion.latency_ms,
                    retries=retries,
                )
                return completion
            except httpx.TimeoutException as exc:
                if attempt < self.config.max_retries:
                    retries += 1
                    await asyncio.sleep(self._retry_delay(attempt))
                    continue
                raise AITimeoutError(
                    "OpenRouter request timed out.",
                    request_id=request.request_id,
                    details={"retries": retries},
                ) from exc
            except httpx.HTTPStatusError as exc:
                raise AIConnectionError(
                    "OpenRouter returned an error status.",
                    request_id=request.request_id,
                    details={
                        "status_code": exc.response.status_code,
                        "body": self._safe_response_text(exc.response),
                    },
                ) from exc
            except httpx.HTTPError as exc:
                if attempt < self.config.max_retries:
                    retries += 1
                    await asyncio.sleep(self._retry_delay(attempt))
                    continue
                raise AIConnectionError(
                    "OpenRouter connection failed.",
                    request_id=request.request_id,
                    details={"retries": retries},
                ) from exc
            except (KeyError, ValueError, TypeError, json.JSONDecodeError) as exc:
                raise AIResponseError(
                    "OpenRouter response could not be parsed.",
                    request_id=request.request_id,
                ) from exc

        raise AIConnectionError(
            "OpenRouter request failed after retries.",
            request_id=request.request_id,
            details={"retries": retries},
        )

    async def stream(self, request: AICompletionRequest) -> AsyncIterator[str]:
        """Stream text deltas from OpenRouter."""

        selected_model = self.config.model_for_role(request.model_role)
        payload = self._build_payload(request, selected_model, stream=True)

        try:
            async with self._client.stream(
                "POST",
                self.CHAT_COMPLETIONS_PATH,
                json=payload,
                headers=self._request_headers(request),
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line.removeprefix("data:").strip()
                    if data == "[DONE]":
                        break
                    if not data:
                        continue
                    chunk = json.loads(data)
                    delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                    if delta:
                        yield delta
        except httpx.TimeoutException as exc:
            raise AITimeoutError("OpenRouter stream timed out.", request_id=request.request_id) from exc
        except httpx.HTTPError as exc:
            raise AIConnectionError("OpenRouter stream failed.", request_id=request.request_id) from exc
        except (KeyError, ValueError, TypeError, json.JSONDecodeError) as exc:
            raise AIResponseError("OpenRouter stream chunk could not be parsed.", request_id=request.request_id) from exc

    async def close(self) -> None:
        """Close the underlying pooled HTTP client if this instance owns it."""

        if self._owns_client:
            await self._client.aclose()

    async def __aenter__(self) -> "OpenRouterClient":
        """Enter an async context manager."""

        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> None:
        """Exit an async context manager and close owned resources."""

        await self.close()

    def _build_payload(
        self,
        request: AICompletionRequest,
        selected_model: str,
        *,
        stream: bool,
    ) -> Dict[str, Any]:
        """Create an OpenRouter-compatible chat-completions payload."""

        payload: Dict[str, Any] = {
            "model": selected_model,
            "messages": [message.model_dump() for message in request.messages],
            "temperature": self.config.temperature,
            "top_p": self.config.top_p,
            "stream": stream,
        }
        if request.response_format == "json_object":
            payload["response_format"] = {"type": "json_object"}
        return payload

    def _parse_completion_body(
        self,
        body: Dict[str, Any],
        request: AICompletionRequest,
        selected_model: str,
        start: float,
        retries: int,
    ) -> AICompletionResponse:
        """Normalize an OpenRouter response body."""

        content = body["choices"][0]["message"].get("content") or ""
        parsed_json = None
        if request.response_format == "json_object":
            parsed_json = json.loads(content) if content else {}

        usage_body = body.get("usage") or {}
        usage = AIUsage(
            prompt_tokens=usage_body.get("prompt_tokens"),
            completion_tokens=usage_body.get("completion_tokens"),
            total_tokens=usage_body.get("total_tokens"),
        )

        return AICompletionResponse(
            request_id=request.request_id,
            agent=request.agent,
            selected_model=selected_model,
            content=content,
            parsed_json=parsed_json,
            usage=usage,
            latency_ms=round((perf_counter() - start) * 1000, 2),
            retries=retries,
        )

    def _should_retry(self, status_code: int, attempt: int) -> bool:
        """Return whether a status code should be retried."""

        return status_code in self.RETRYABLE_STATUS_CODES and attempt < self.config.max_retries

    def _retry_delay(self, attempt: int) -> float:
        """Return a bounded retry delay in seconds."""

        return min(2 ** attempt, 8)

    def _safe_response_text(self, response: httpx.Response) -> str:
        """Return a short provider response body without request headers."""

        return response.text[:500]
