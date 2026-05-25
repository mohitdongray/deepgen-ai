"""Download and persist generated media to local storage."""

import base64
import logging
from pathlib import Path

from app.config import Settings
from app.core.http import HttpClient
from app.exceptions import DeepGenError

logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = frozenset({"png", "jpg", "jpeg", "webp", "gif"})


class MediaService:
    def __init__(self, settings: Settings, http: HttpClient):
        self._settings = settings
        self._outputs = Path(settings.outputs_dir)
        self._http = http

    def ensure_outputs_dir(self) -> None:
        self._outputs.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _extension_from_url(url: str, default: str) -> str:
        clean = url.split("?")[0]
        segment = clean.rsplit("/", 1)[-1]
        if "." in segment:
            ext = segment.rsplit(".", 1)[-1].lower()
            if len(ext) <= 4:
                return ext
        return default

    async def save_from_url(
        self, job_id: str, media_url: str, *, mode: str
    ) -> tuple[str, str]:
        """Save media and return (relative_path, extension)."""
        self.ensure_outputs_dir()

        if media_url.startswith("data:image"):
            header, encoded = media_url.split(",", 1)
            ext = header.split(";")[0].split("/")[1]
            file_path = self._outputs / f"{job_id}.{ext}"
            file_path.write_bytes(base64.b64decode(encoded))
            return f"/outputs/{job_id}.{ext}", ext

        content = await self._http.download(media_url)
        default_ext = "jpg" if mode == "image" else "mp4"
        ext = self._extension_from_url(media_url, default_ext)
        file_path = self._outputs / f"{job_id}.{ext}"
        file_path.write_bytes(content)
        logger.info("Saved media to %s", file_path)
        return f"/outputs/{job_id}.{ext}", ext

    def is_image_mode(self, mode: str, ext: str) -> bool:
        return mode == "image" or ext in IMAGE_EXTENSIONS
