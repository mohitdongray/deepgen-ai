import asyncio
import httpx
import logging
from typing import Optional, Dict, Any
from app.config import Settings

logger = logging.getLogger(__name__)

class HttpClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: Optional[httpx.AsyncClient] = None

    async def start(self):
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.settings.http_timeout),
            limits=httpx.Limits(max_keepalive_connections=20)
        )

    async def stop(self):
        if self._client:
            await self._client.aclose()

    async def post(self, url: str, headers: Dict[str, str], json: Dict[str, Any], timeout: Optional[httpx.Timeout] = None, retry: bool = True):
        return await self._request("POST", url, headers=headers, json=json, timeout=timeout, retry=retry)

    async def get(self, url: str, headers: Dict[str, str], retry: bool = True):
        return await self._request("GET", url, headers=headers, retry=retry)

    async def _request(self, method: str, url: str, **kwargs):
        retry = kwargs.pop("retry", True)
        for attempt in range(3 if retry else 1):
            try:
                resp = await self._client.request(method, url, **kwargs)
                return resp
            except (httpx.ConnectError, httpx.TimeoutException) as e:
                if attempt == 2:
                    raise
                logger.warning(f"Request failed (attempt {attempt+1}): {e}")
                await asyncio.sleep(1.0)
        raise RuntimeError("Unreachable")