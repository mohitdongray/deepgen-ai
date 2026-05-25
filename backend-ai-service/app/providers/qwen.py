import logging
import httpx
from app.config import Settings
from app.core.http import HttpClient
from app.providers.base import BaseProvider, GenerationResult

logger = logging.getLogger(__name__)

class QwenProvider(BaseProvider):
    name = "qwen"

    def __init__(self, settings: Settings, http: HttpClient):
        self._settings = settings
        self._http = http

    def is_available(self) -> bool:
        return bool(self._settings.qwen_api_key)

    async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
        if not self._settings.qwen_api_key:
            raise Exception("QWEN_API_KEY not set")

        url = f"{self._settings.qwen_base_url.rstrip('/')}/services/aigc/multimodal-generation/generation"
        headers = {
            "Authorization": f"Bearer {self._settings.qwen_api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self._settings.qwen_model,
            "input": {
                "messages": [{"role": "user", "content": [{"text": prompt}]}]
            },
            "parameters": {
                "size": self._settings.qwen_image_size,
                "prompt_extend": True,
                "watermark": False,
            },
        }

        timeout = httpx.Timeout(self._settings.qwen_timeout)
        response = await self._http.post(url, headers=headers, json=body, timeout=timeout)

        if response.status_code != 200:
            raise Exception(f"Qwen HTTP {response.status_code}: {response.text[:500]}")

        data = response.json()
        if data.get("code"):
            raise Exception(f"Qwen API error [{data['code']}]: {data.get('message')}")

        choices = data.get("output", {}).get("choices", [])
        for choice in choices:
            content = choice.get("message", {}).get("content", [])
            for item in content:
                if isinstance(item, dict) and item.get("image"):
                    return GenerationResult(provider=self.name, output=item["image"], image_url=item["image"])
        raise Exception("No image URL in Qwen response")
