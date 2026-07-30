"""
OpenRouter LLM Provider for Plum.ai

Uses the OpenAI-compatible SDK to call OpenRouter's API.
Includes retry logic with exponential backoff for 429/503/504 errors.
Tracks token usage from response headers.
"""

import time
import logging
from typing import List, Dict, Any, Generator
from openai import OpenAI
from backend.ai.llm.base import BaseLLMProvider, LLMResponse
from backend.utils.config import settings

logger = logging.getLogger("plum.ai.llm.openrouter")

# ---------------------------------------------------------------------------
# Retry Configuration
# ---------------------------------------------------------------------------
MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = [1, 2, 4]  # Exponential backoff
RETRYABLE_STATUS_CODES = {429, 503, 504}


def _is_retryable_error(error: Exception) -> bool:
    """Check if the error is a retryable HTTP error (429, 503, 504)."""
    error_str = str(error)
    for code in RETRYABLE_STATUS_CODES:
        if str(code) in error_str:
            return True
    if hasattr(error, "status_code") and error.status_code in RETRYABLE_STATUS_CODES:
        return True
    return False


class OpenRouterProvider(BaseLLMProvider):
    """OpenRouter LLM provider using the OpenAI-compatible API."""

    def __init__(self):
        self._client: OpenAI | None = None
        # Mutable token counters for the last request (updated after stream/generate)
        self._last_prompt_tokens: int = 0
        self._last_completion_tokens: int = 0
        self._last_total_tokens: int = 0

    def _get_client(self) -> OpenAI | None:
        """Lazy-initialize the OpenAI client configured for OpenRouter."""
        if self._client is None and settings.OPENROUTER_API_KEY:
            self._client = OpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
                timeout=settings.REQUEST_TIMEOUT,
            )
        return self._client

    @property
    def provider_name(self) -> str:
        return "OpenRouter"

    @property
    def model_name(self) -> str:
        return settings.OPENROUTER_MODEL

    @property
    def last_token_usage(self) -> Dict[str, int]:
        """Return token usage from the last request."""
        return {
            "prompt_tokens": self._last_prompt_tokens,
            "completion_tokens": self._last_completion_tokens,
            "total_tokens": self._last_total_tokens,
        }

    def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
        max_tokens: int = 800,
    ) -> Generator[str, None, None]:
        """Stream text chunks from OpenRouter with automatic retry on 429/503/504."""
        client = self._get_client()
        if client is None:
            logger.error("OpenRouter API key not configured.")
            yield "\n[System Error: OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in .env]\n"
            return

        # Reset token counters
        self._last_prompt_tokens = 0
        self._last_completion_tokens = 0
        self._last_total_tokens = 0

        last_error = None
        for attempt in range(MAX_RETRIES):
            try:
                if attempt > 0:
                    wait_time = RETRY_BACKOFF_SECONDS[min(attempt - 1, len(RETRY_BACKOFF_SECONDS) - 1)]
                    logger.warning(f"Retry {attempt}/{MAX_RETRIES} after {wait_time}s backoff...")
                    time.sleep(wait_time)

                response = client.chat.completions.create(
                    model=settings.OPENROUTER_MODEL,
                    messages=messages,
                    stream=True,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream_options={"include_usage": True},
                )

                for chunk in response:
                    # Capture token usage from the final chunk
                    if hasattr(chunk, "usage") and chunk.usage:
                        self._last_prompt_tokens = getattr(chunk.usage, "prompt_tokens", 0) or 0
                        self._last_completion_tokens = getattr(chunk.usage, "completion_tokens", 0) or 0
                        self._last_total_tokens = getattr(chunk.usage, "total_tokens", 0) or 0

                    delta = chunk.choices[0].delta if chunk.choices else None
                    if delta and delta.content:
                        yield delta.content

                return  # Success

            except Exception as e:
                last_error = e
                if _is_retryable_error(e) and attempt < MAX_RETRIES - 1:
                    logger.warning(f"Retryable error on attempt {attempt + 1}: {str(e)}")
                    continue
                else:
                    break

        logger.error(f"OpenRouter API failed after {MAX_RETRIES} attempts: {str(last_error)}")
        yield "\n[System Error: OpenRouter model failed after retries. Falling back to local responder...]\n"

    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
        max_tokens: int = 800,
    ) -> LLMResponse:
        """Non-streaming generation. Returns full response with token counts."""
        client = self._get_client()
        if client is None:
            return LLMResponse(text="[Error: OpenRouter API key not configured]")

        self._last_prompt_tokens = 0
        self._last_completion_tokens = 0
        self._last_total_tokens = 0

        last_error = None
        for attempt in range(MAX_RETRIES):
            try:
                if attempt > 0:
                    wait_time = RETRY_BACKOFF_SECONDS[min(attempt - 1, len(RETRY_BACKOFF_SECONDS) - 1)]
                    time.sleep(wait_time)

                response = client.chat.completions.create(
                    model=settings.OPENROUTER_MODEL,
                    messages=messages,
                    stream=False,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                text = response.choices[0].message.content if response.choices else ""
                usage = response.usage

                self._last_prompt_tokens = usage.prompt_tokens if usage else 0
                self._last_completion_tokens = usage.completion_tokens if usage else 0
                self._last_total_tokens = usage.total_tokens if usage else 0

                return LLMResponse(
                    text=text or "",
                    prompt_tokens=self._last_prompt_tokens,
                    completion_tokens=self._last_completion_tokens,
                    total_tokens=self._last_total_tokens,
                    model=settings.OPENROUTER_MODEL,
                )

            except Exception as e:
                last_error = e
                if _is_retryable_error(e) and attempt < MAX_RETRIES - 1:
                    continue
                else:
                    break

        return LLMResponse(text=f"[Error: OpenRouter failed after {MAX_RETRIES} retries: {str(last_error)}]")

    def health_check(self) -> Dict[str, Any]:
        """Verify that OpenRouter and the configured model are reachable."""
        client = self._get_client()
        if client is None:
            return {
                "healthy": False,
                "provider": self.provider_name,
                "model": self.model_name,
                "detail": "OPENROUTER_API_KEY is not configured.",
            }

        try:
            # Send a minimal request to verify connectivity
            response = client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
                temperature=0,
            )
            return {
                "healthy": True,
                "provider": self.provider_name,
                "model": self.model_name,
                "detail": "Model is reachable and responding.",
            }
        except Exception as e:
            return {
                "healthy": False,
                "provider": self.provider_name,
                "model": self.model_name,
                "detail": f"Health check failed: {str(e)}",
            }


# Singleton instance
openrouter_provider = OpenRouterProvider()
