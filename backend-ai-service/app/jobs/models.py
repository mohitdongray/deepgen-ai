"""Job domain models."""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobRecord(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.PENDING
    mode: str = "image"
    success: Optional[bool] = None
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    provider: Optional[str] = None
    error: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    def to_api_dict(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=False)
