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
# Import MockVideoProvider but we won't use it as fallback
# from app.providers.mock_video import MockVideoProvider

logger = logging.getLogger(__name__)

class ProviderRegistry:
    def __init__(self, settings: Settings, http: HttpClient):
        self.settings = settings
        self.http = http

    async def generate(self, mode: str, prompt: str, replica_id: str = None, audio_url: str = None) -> Tuple[GenerationResult, str]:
        if mode == "image":
            providers = self._get_image_providers()
        elif mode == "video":
            providers = self._get_video_providers()
        else:
            raise ValueError(f"Unsupported mode: {mode}")

        logger.info(f"[REGISTRY] generate called with mode={mode}, replica_id={replica_id}, audio_url={audio_url}")

        for provider in providers:
            try:
                logger.info(f"Trying provider {provider.name}")
                # Tavus needs 15+ minutes, images are 30-60s
                provider_timeout = 900.0 if provider.name == "tavus" else 120.0
                result = await asyncio.wait_for(
                    provider.generate(prompt, mode=mode, replica_id=replica_id, audio_url=audio_url),
                    timeout=provider_timeout
                )
                return result, provider.name
            except asyncio.TimeoutError:
                logger.warning(f"Provider {provider.name} timed out after {provider_timeout}s")
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
        # Only Tavus – no mock fallback (test on Render)
        tavus = TavusProvider(self.settings, self.http)
        if not tavus.is_available():
            raise RuntimeError("Tavus provider not available – missing API key or replica ID")
        logger.info("Tavus video provider is the only video provider (mock disabled)")
        return [tavus]