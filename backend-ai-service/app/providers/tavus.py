import asyncio
import logging
from app.config import Settings
from app.core.http import HttpClient
from app.providers.base import BaseProvider, GenerationResult

logger = logging.getLogger(__name__)

class TavusProvider(BaseProvider):
    name = "tavus"

    def __init__(self, settings: Settings, http: HttpClient):
        self._settings = settings
        self._http = http

    def is_available(self) -> bool:
        return bool(self._settings.tavus_api_key and self._settings.tavus_replica_id)

    async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
        if not self.is_available():
            raise Exception("TAVUS_API_KEY or TAVUS_REPLICA_ID missing")

        headers = {
            "x-api-key": self._settings.tavus_api_key,
            "Content-Type": "application/json",
        }
        create_url = f"{self._settings.tavus_base_url.rstrip('/')}/videos"
        body = {
            "replica_id": self._settings.tavus_replica_id,
            "script": prompt,
            "video_name": f"deepgen_{hash(prompt)}",
        }

        create_resp = await self._http.post(create_url, headers=headers, json=body)
        if create_resp.status_code != 201:
            raise Exception(f"Tavus create error {create_resp.status_code}: {create_resp.text[:500]}")

        video_id = create_resp.json().get("video_id")
        if not video_id:
            raise Exception("Tavus: no video_id in response")

        status_url = f"{self._settings.tavus_base_url}/videos/{video_id}"
        for attempt in range(1, self._settings.tavus_max_polls + 1):
            await asyncio.sleep(self._settings.tavus_poll_interval)
            poll_resp = await self._http.get(status_url, headers=headers)
            if poll_resp.status_code != 200:
                continue
            data = poll_resp.json()
            status = data.get("status")
            if status == "ready":
                video_url = data.get("hosted_url")
                if not video_url:
                    raise Exception("Tavus ready but no hosted_url")
                return GenerationResult(provider=self.name, output=video_url, video_url=video_url)
            if status == "failed":
                raise Exception(f"Tavus failed: {data.get('error_message')}")
        raise Exception("Tavus video generation timed out")
