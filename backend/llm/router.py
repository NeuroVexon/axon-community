"""
Axon by NeuroVexon - LLM Provider Router
"""

from typing import Optional
import logging

from .provider import BaseLLMProvider
from .ollama import OllamaProvider
from .claude import ClaudeProvider
from .openai_provider import OpenAIProvider
from core.config import settings, LLMProvider

logger = logging.getLogger(__name__)


class LLMRouter:
    """Routes requests to the configured LLM provider"""

    def __init__(self):
        self._providers: dict[LLMProvider, BaseLLMProvider] = {}
        self._current_provider: Optional[LLMProvider] = None
        self._db_settings: dict = {}

    def update_settings(self, db_settings: dict):
        """Update router with settings from database"""
        self._db_settings = db_settings

        # Update Claude provider if exists
        if LLMProvider.CLAUDE in self._providers:
            api_key = db_settings.get("anthropic_api_key") or settings.anthropic_api_key
            model = db_settings.get("claude_model") or settings.claude_model
            self._providers[LLMProvider.CLAUDE].update_config(api_key=api_key, model=model)

        # Update OpenAI provider if exists
        if LLMProvider.OPENAI in self._providers:
            api_key = db_settings.get("openai_api_key") or settings.openai_api_key
            model = db_settings.get("openai_model") or settings.openai_model
            self._providers[LLMProvider.OPENAI].update_config(api_key=api_key, model=model)

    def _get_or_create_provider(self, provider: LLMProvider) -> BaseLLMProvider:
        """Get or create a provider instance"""
        if provider not in self._providers:
            if provider == LLMProvider.OLLAMA:
                self._providers[provider] = OllamaProvider()
            elif provider == LLMProvider.CLAUDE:
                p = ClaudeProvider()
                api_key = self._db_settings.get("anthropic_api_key") or settings.anthropic_api_key
                model = self._db_settings.get("claude_model") or settings.claude_model
                p.update_config(api_key=api_key, model=model)
                self._providers[provider] = p
            elif provider == LLMProvider.OPENAI:
                p = OpenAIProvider()
                api_key = self._db_settings.get("openai_api_key") or settings.openai_api_key
                model = self._db_settings.get("openai_model") or settings.openai_model
                p.update_config(api_key=api_key, model=model)
                self._providers[provider] = p
            else:
                raise ValueError(f"Unknown provider: {provider}")
        return self._providers[provider]

    def get_provider(self, provider: Optional[LLMProvider] = None) -> BaseLLMProvider:
        """Get the LLM provider to use"""
        target = provider or settings.llm_provider
        return self._get_or_create_provider(target)

    def get_current_provider_name(self) -> str:
        """Get the name of the current provider from DB or default"""
        return self._db_settings.get("llm_provider", settings.llm_provider.value)

    async def health_check_all(self) -> dict[str, bool]:
        """Check health of all providers"""
        results = {}
        for provider in LLMProvider:
            try:
                p = self._get_or_create_provider(provider)
                results[provider.value] = await p.health_check()
            except Exception as e:
                logger.warning(f"Health check failed for {provider}: {e}")
                results[provider.value] = False
        return results


# Global router instance
llm_router = LLMRouter()
