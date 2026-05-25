"""Request and response schemas."""

from typing import Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class GenerateJsonRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    job_id: Optional[str] = None
    mode: str = "image"
    prompt: Optional[str] = None
    description: Optional[str] = None
    text: Optional[str] = None
    image_url: Optional[str] = None
    consent_confirmed: Union[str, bool] = "true"

    @field_validator("consent_confirmed", mode="before")
    @classmethod
    def normalize_consent(cls, value: Union[str, bool, None]) -> str:
        if value is None:
            return "true"
        if isinstance(value, bool):
            return "true" if value else "false"
        return str(value).strip().lower()

    @field_validator("consent_confirmed")
    @classmethod
    def validate_consent(cls, value: str) -> str:
        if value not in ("true", "1", "yes"):
            raise ValueError("consent_confirmed must be true")
        return "true"

    @field_validator("mode")
    @classmethod
    def normalize_mode(cls, value: str) -> str:
        return (value or "image").strip().lower()

    def prompt_text(self) -> str:
        return (
            (self.prompt or "").strip()
            or (self.description or "").strip()
            or (self.text or "").strip()
            or "a beautiful scene"
        )

    @model_validator(mode="after")
    def require_prompt(self) -> "GenerateJsonRequest":
        if not self.prompt_text().strip():
            raise ValueError("prompt (or description) is required")
        return self


class JobResponse(BaseModel):
    job_id: str
    status: str
    success: Optional[bool] = None
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    provider: Optional[str] = None
    error: Optional[str] = None
    request_id: Optional[str] = None
    provider_chain: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_job(cls, job) -> "JobResponse":
        chain = (job.metadata or {}).get("provider_chain")
        return cls(
            job_id=job.job_id,
            status=job.status.value if hasattr(job.status, "value") else job.status,
            success=job.success,
            video_url=job.video_url,
            image_url=job.image_url,
            provider=job.provider,
            error=job.error,
            provider_chain=chain,
        )


class GenerateAcceptedResponse(BaseModel):
    job_id: str
    status: str = "pending"
    request_id: Optional[str] = None
