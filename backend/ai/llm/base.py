"""
Base LLM Provider Interface for Plum.ai

All LLM providers (OpenRouter, Gemini, Ollama, etc.) implement this interface.
This makes future migrations trivial — only create a new provider file and swap in config.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Generator, Optional

logger = logging.getLogger("plum.ai.llm")


@dataclass
class LLMResponse:
    """Structured response from an LLM provider, including token usage."""
    text: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    model: str = ""


class BaseLLMProvider(ABC):
    """Abstract base class that every LLM provider must implement."""

    @abstractmethod
    def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
        max_tokens: int = 800,
    ) -> Generator[str, None, None]:
        """Stream text chunks from the LLM.
        
        Args:
            messages: OpenAI-format messages list [{role, content}, ...].
            temperature: Sampling temperature.
            max_tokens: Maximum output tokens.
        
        Yields:
            Text chunks as they arrive.
        """
        ...

    @abstractmethod
    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
        max_tokens: int = 800,
    ) -> LLMResponse:
        """Non-streaming generation. Returns the full response with token usage.
        
        Args:
            messages: OpenAI-format messages list [{role, content}, ...].
            temperature: Sampling temperature.
            max_tokens: Maximum output tokens.
        
        Returns:
            LLMResponse with text and token counts.
        """
        ...

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Check if the LLM provider is reachable and the model is available.
        
        Returns:
            Dict with keys: healthy (bool), provider (str), model (str), detail (str).
        """
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name, e.g. 'OpenRouter'."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Active model identifier, e.g. 'google/gemma-4-31b-it:free'."""
        ...
