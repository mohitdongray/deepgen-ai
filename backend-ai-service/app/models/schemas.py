"""
Pydantic Models for Request/Response Validation

Defines the data schemas for the API.
Ensures type safety and automatic validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    """Enumeration of possible job statuses."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class GenerationRequest(BaseModel):
    """Request model for video generation."""
    job_id: str = Field(..., description="Unique job identifier")
    consent_confirmed: bool = Field(..., description="User consent confirmation")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")

class GenerationResponse(BaseModel):
    """Response model for generation initiation."""
    job_id: str
    status: str
    message: str
    estimated_time: Optional[int] = Field(None, description="Estimated processing time in seconds")

class JobResult(BaseModel):
    """Result data for completed job."""
    video_url: str
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None

class StatusResponse(BaseModel):
    """Response model for status checks."""
    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    result: Optional[JobResult] = None
    error: Optional[str] = None
    provider: Optional[str] = None
    processing_time: Optional[str] = None

    class Config:
        from_attributes = True
