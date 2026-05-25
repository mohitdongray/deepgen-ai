"""Async job persistence with file backing and in-memory cache."""

import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, Optional

from app.config import Settings
from app.exceptions import JobNotFoundError
from app.jobs.models import JobRecord, JobStatus

logger = logging.getLogger(__name__)


class JobStore:
    """Thread-safe async job store backed by a JSON file."""

    def __init__(self, settings: Settings):
        self._path = Path(settings.jobs_file)
        self._lock = asyncio.Lock()
        self._jobs: Dict[str, JobRecord] = {}

    async def load(self) -> None:
        async with self._lock:
            if not self._path.exists():
                self._jobs = {}
                return
            try:
                raw = json.loads(self._path.read_text(encoding="utf-8"))
                self._jobs = {
                    job_id: JobRecord.model_validate(data)
                    for job_id, data in raw.items()
                }
                logger.info("Loaded %s jobs from %s", len(self._jobs), self._path)
            except (json.JSONDecodeError, ValueError) as exc:
                logger.error("Failed to load jobs file: %s", exc)
                self._jobs = {}

    async def _persist(self) -> None:
        data = {job_id: job.to_api_dict() for job_id, job in self._jobs.items()}
        self._path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    async def create(self, job: JobRecord) -> JobRecord:
        async with self._lock:
            self._jobs[job.job_id] = job
            await self._persist()
        return job

    async def get(self, job_id: str) -> JobRecord:
        async with self._lock:
            job = self._jobs.get(job_id)
        if job is None:
            raise JobNotFoundError(job_id)
        return job

    async def update(self, job_id: str, **fields) -> JobRecord:
        async with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                raise JobNotFoundError(job_id)
            updated = job.model_copy(update=fields)
            self._jobs[job_id] = updated
            await self._persist()
        return updated

    async def set_status(self, job_id: str, status: JobStatus, **extra) -> JobRecord:
        return await self.update(job_id, status=status, **extra)

    def count_by_status(self) -> Dict[str, int]:
        counts: Dict[str, int] = {}
        for job in self._jobs.values():
            key = job.status.value
            counts[key] = counts.get(key, 0) + 1
        return counts
