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
        available = bool(self._settings.tavus_api_key and self._settings.tavus_replica_id)
        logger.info(f"[TAVUS] is_available() -> {available}")
        return available

    async def generate(
        self, prompt: str, *, mode: str, replica_id: str = None, audio_url: str = None
    ) -> GenerationResult:
        logger.info("[TAVUS] generate() started")

        if not self.is_available():
            raise Exception("TAVUS_API_KEY or TAVUS_REPLICA_ID missing")

        replica_id_to_use = replica_id or self._settings.tavus_replica_id
        logger.info(f"[TAVUS] Using replica_id: {replica_id_to_use}")

        headers = {
            "x-api-key": self._settings.tavus_api_key,
            "Content-Type": "application/json",
        }
        create_url = f"{self._settings.tavus_base_url.rstrip('/')}/videos"

        body = {
            "replica_id": replica_id_to_use,
            "video_name": f"deepgen_{abs(hash(prompt or audio_url or 'default'))}",
        }
        if audio_url:
            body["audio_url"] = audio_url
            logger.info(f"[TAVUS] Sending audio_url: {audio_url}")
        else:
            body["script"] = prompt or "Default script"
            logger.info("[TAVUS] Sending script (no audio_url)")

        logger.info(f"[TAVUS] POST to {create_url} with body: {body}")
        create_resp = await self._http.post(create_url, headers=headers, json=body)

        logger.info(f"[TAVUS] Create response status: {create_resp.status_code}")
        logger.info(f"[TAVUS] Create response body: {create_resp.text[:500]}")

        if create_resp.status_code not in (200, 201):
            raise Exception(
                f"Tavus create error {create_resp.status_code}: {create_resp.text[:500]}"
            )

        video_id = create_resp.json().get("video_id")
        if not video_id:
            raise Exception(f"Tavus: no video_id in response: {create_resp.text[:200]}")

        logger.info(f"[TAVUS] Created video_id={video_id}, polling...")
        status_url = f"{self._settings.tavus_base_url.rstrip('/')}/videos/{video_id}"

        for attempt in range(1, self._settings.tavus_max_polls + 1):
            await asyncio.sleep(self._settings.tavus_poll_interval)
            poll_resp = await self._http.get(status_url, headers=headers)

            if poll_resp.status_code != 200:
                logger.warning(f"[TAVUS] Poll {attempt}: HTTP {poll_resp.status_code}")
                continue

            data = poll_resp.json()
            status = data.get("status", "unknown")
            logger.info(f"[TAVUS] Poll {attempt}: status={status}")

            if status in ("ready", "completed"):
                video_url = data.get("download_url") or data.get("hosted_url")
                if not video_url:
                    raise Exception(f"Tavus ready but no video URL in response: {data}")
                logger.info(f"[TAVUS] Success! video_url={video_url}")
                return GenerationResult(provider=self.name, output=video_url, video_url=video_url)

            if status == "failed":
                error_msg = data.get("error_message") or data.get("error") or "Unknown error"
                raise Exception(f"Tavus video failed: {error_msg}")

        raise Exception(
            f"Tavus video timed out after {self._settings.tavus_max_polls} polls "
            f"({self._settings.tavus_max_polls * self._settings.tavus_poll_interval:.0f}s)"
        )