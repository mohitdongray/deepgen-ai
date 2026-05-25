"""Generation and job status endpoints."""

import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, File, Form, Request, UploadFile

from app.api.schemas import GenerateAcceptedResponse, GenerateJsonRequest, JobResponse
from app.exceptions import ConsentRequiredError, JobNotFoundError
from app.jobs.models import JobRecord, JobStatus

logger = logging.getLogger(__name__)

router = APIRouter(tags=["generation"])


def _parse_consent(consent_confirmed: str) -> None:
    if consent_confirmed.lower() not in ("true", "1", "yes"):
        raise ConsentRequiredError()


@router.post("/generate", response_model=GenerateAcceptedResponse)
async def generate_multipart(
    request: Request,
    background_tasks: BackgroundTasks,
    description: str = Form(...),
    mode: str = Form(...),
    consent_confirmed: str = Form(default="true"),
    source_image: UploadFile | None = File(None),
    target_video: UploadFile | None = File(None),
):
    _parse_consent(consent_confirmed)

    if source_image or target_video:
        logger.debug(
            "File upload received (source_image=%s, target_video=%s) — "
            "file-based modes use prompt for now",
            bool(source_image),
            bool(target_video),
        )

    job_id = str(uuid.uuid4())
    logger.info("Job %s queued mode=%s prompt=%.60s", job_id, mode, description)

    job_store = request.app.state.job_store
    generation_service = request.app.state.generation_service

    await job_store.create(
        JobRecord(job_id=job_id, status=JobStatus.PENDING, mode=mode)
    )

    background_tasks.add_task(
        generation_service.process_job, job_id, description, mode
    )

    return GenerateAcceptedResponse(job_id=job_id, status="pending")


@router.post("/generate-json", response_model=GenerateAcceptedResponse)
async def generate_json(
    request: Request,
    body: GenerateJsonRequest,
    background_tasks: BackgroundTasks,
):
    job_id = body.job_id or str(uuid.uuid4())
    prompt = body.prompt_text()
    mode = body.mode

    logger.info("Job %s queued (json) mode=%s prompt=%.60s", job_id, mode, prompt)

    job_store = request.app.state.job_store
    generation_service = request.app.state.generation_service

    await job_store.create(
        JobRecord(job_id=job_id, status=JobStatus.PENDING, mode=mode)
    )

    background_tasks.add_task(
        generation_service.process_job, job_id, prompt, mode
    )

    return GenerateAcceptedResponse(
        job_id=job_id, status="pending", request_id=job_id
    )


@router.get("/status/{job_id}", response_model=JobResponse)
async def get_status(request: Request, job_id: str):
    job_store = request.app.state.job_store
    try:
        job = await job_store.get(job_id)
    except JobNotFoundError:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Job not found") from None

    return JobResponse.from_job(job)
