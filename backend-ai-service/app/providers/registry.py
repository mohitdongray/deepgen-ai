import logging
import asyncio
from typing import List, Tuple
from app.config import Settings
from app.core.http import HttpClient
from app.providers.base import BaseProvider, GenerationResult
from app.providers.pollinations import PollinationsProvider
from app.providers.qwen import QwenProvider
from app.providers.flux import FluxProvider
from app.providers.tavus import TavusProvider

logger = logging.getLogger(__name__)

class ProviderRegistry:
    def __init__(self, settings: Settings, http: HttpClient):
        self.settings = settings
        self.http = http

    async def generate(self, mode: str, prompt: str) -> Tuple[GenerationResult, str]:
        if mode == "image":
            providers = self._get_image_providers()
        elif mode == "video":
            providers = self._get_video_providers()
        else:
            raise ValueError(f"Unsupported mode: {mode}")

        for provider in providers:
            try:
                logger.info(f"Trying provider {provider.name}")
                result = await asyncio.wait_for(
                    provider.generate(prompt, mode=mode),
                    timeout=10.0   # fail fast
                )
                return result, provider.name
            except asyncio.TimeoutError:
                logger.warning(f"Provider {provider.name} timed out after 10s")
            except Exception as e:
                logger.warning(f"Provider {provider.name} failed: {e}")
        raise RuntimeError("All providers failed")

    def _get_image_providers(self) -> List[BaseProvider]:
        # Pollinations first – instant, free, no API key
        providers = [PollinationsProvider()]
        qwen = QwenProvider(self.settings, self.http)
        if qwen.is_available():
            providers.append(qwen)
        flux = FluxProvider(self.settings, self.http)
        if flux.is_available():
            providers.append(flux)
        return providers

    def _get_video_providers(self) -> List[BaseProvider]:
        tavus = TavusProvider(self.settings, self.http)
        if not tavus.is_available():
            raise RuntimeError("Tavus provider not available (missing API key or replica ID)")
        return [tavus]