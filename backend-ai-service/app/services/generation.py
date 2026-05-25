"""Background generation pipeline — orchestrates providers and media persistence."""

import logging

from app.exceptions import AllProvidersFailedError, DeepGenError
from app.jobs.models import JobStatus
from app.jobs.store import JobStore
from app.providers.base import GenerationResult
from app.providers.registry import ProviderRegistry
from app.services.media import MediaService

logger = logging.getLogger(__name__)


class GenerationService:
    def __init__(
        self,
        registry: ProviderRegistry,
        job_store: JobStore,
        media_service: MediaService,
    ):
        self._registry = registry
        self._jobs = job_store
        self._media = media_service

    @staticmethod
    def _extract_media_url(result: GenerationResult) -> str | None:
        url = result.primary_url()
        if url:
            return url
        output = result.output
        if isinstance(output, str) and (
            output.startswith("http") or output.startswith("data:")
        ):
            return output
        return None

    async def process_job(self, job_id: str, prompt: str, mode: str) -> None:
        logger.info("Processing job %s mode=%s", job_id, mode)

        try:
            await self._jobs.set_status(job_id, JobStatus.PROCESSING)

            result, chain_report = await self._registry.generate(mode, prompt)
            media_url = self._extract_media_url(result)

            if not media_url:
                raise DeepGenError("Provider returned no media URL")

            provider_name = result.provider
            logger.info("Job %s provider=%s url=%s...", job_id, provider_name, media_url[:80])

            try:
                relative_path, ext = await self._media.save_from_url(
                    job_id, media_url, mode=mode
                )
                is_image = self._media.is_image_mode(mode, ext)
                update_fields = {
                    "status": JobStatus.COMPLETED,
                    "provider": provider_name,
                    "success": True,
                    "metadata": {"provider_chain": chain_report.to_dict()},
                }
                if is_image:
                    update_fields["image_url"] = relative_path
                else:
                    update_fields["video_url"] = relative_path
                await self._jobs.update(job_id, **update_fields)
                logger.info("Job %s completed — saved %s", job_id, relative_path)

            except Exception as dl_err:
                logger.warning(
                    "Job %s download failed (%s) — storing remote URL", job_id, dl_err
                )
                update_fields = {
                    "status": JobStatus.COMPLETED,
                    "provider": provider_name,
                    "success": True,
                    "metadata": {"provider_chain": chain_report.to_dict()},
                }
                if mode == "image" or "image" in mode:
                    update_fields["image_url"] = media_url
                else:
                    update_fields["video_url"] = media_url
                await self._jobs.update(job_id, **update_fields)

        except AllProvidersFailedError as exc:
            logger.error("Job %s all providers failed: %s", job_id, exc.errors)
            await self._jobs.update(
                job_id,
                status=JobStatus.FAILED,
                success=False,
                error=str(exc),
                metadata={"provider_chain": self._registry.last_chain_report()},
            )
        except DeepGenError as exc:
            logger.error("Job %s failed: %s", job_id, exc.message)
            await self._jobs.update(
                job_id,
                status=JobStatus.FAILED,
                success=False,
                error=exc.message,
            )
        except Exception as exc:
            logger.exception("Job %s unexpected error", job_id)
            await self._jobs.update(
                job_id,
                status=JobStatus.FAILED,
                success=False,
                error=str(exc),
            )
