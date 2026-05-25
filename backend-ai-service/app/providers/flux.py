import asyncio
import logging
from app.config import Settings
from app.core.http import HttpClient
from app.providers.base import BaseProvider, GenerationResult

logger = logging.getLogger(__name__)

class FluxProvider(BaseProvider):
    name = "flux"

    def __init__(self, settings: Settings, http: HttpClient):
        self._settings = settings
        self._http = http

    def is_available(self) -> bool:
        return bool(self._settings.flux_api_key)

    async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
        if not self._settings.flux_api_key:
            raise Exception("FLUX_API_KEY not set")

        submit_url = f"{self._settings.flux_base_url.rstrip('/')}/{self._settings.flux_model_endpoint}"
        headers = {
            "accept": "application/json",
            "x-key": self._settings.flux_api_key,
            "content-type": "application/json",
        }
        payload = {
            "prompt": prompt,
            "width": self._settings.flux_width,
            "height": self._settings.flux_height,
        }

        submit_resp = await self._http.post(submit_url, headers=headers, json=payload)
        if submit_resp.status_code not in (200, 201, 202):
            raise Exception(f"Flux submit error {submit_resp.status_code}: {submit_resp.text[:500]}")

        submit_data = submit_resp.json()
        polling_url = submit_data.get("polling_url") or submit_data.get("result", {}).get("polling_url")
        if not polling_url:
            raise Exception(f"Flux: no polling_url in response: {submit_data}")

        for attempt in range(1, self._settings.flux_max_polls + 1):
            await asyncio.sleep(self._settings.flux_poll_interval)
            poll_resp = await self._http.get(polling_url, headers=headers)
            if poll_resp.status_code != 200:
                continue
            poll_data = poll_resp.json()
            status = poll_data.get("status")
            if status == "Ready":
                image_url = poll_data.get("result", {}).get("sample")
                if not image_url:
                    raise Exception("Flux Ready but no sample URL")
                return GenerationResult(provider=self.name, output=image_url, image_url=image_url)
            if status in ("Error", "Failed"):
                raise Exception(f"Flux failed: {poll_data.get('error', poll_data)}")

        raise Exception(f"Flux timed out after {self._settings.flux_max_polls * self._settings.flux_poll_interval}s")
