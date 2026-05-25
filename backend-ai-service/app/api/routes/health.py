"""Health and root endpoints."""

from fastapi import APIRouter, Request

from app.config import Settings

router = APIRouter(tags=["health"])


@router.get("/")
async def root(request: Request):
    settings: Settings = request.app.state.settings
    return {
        "status": "DeepGen AI is running",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/health")
async def health(request: Request):
    settings: Settings = request.app.state.settings
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "providers_configured": settings.masked_key_status(),
    }


@router.get("/metrics")
async def metrics(request: Request):
    job_store = request.app.state.job_store
    return {
        "jobs": job_store.count_by_status(),
    }


@router.get("/providers")
async def providers(request: Request):
    registry = request.app.state.registry
    return {
        "providers": registry.provider_status(),
        "chains": {
            "image": registry.chain_for_mode("image"),
            "video": registry.chain_for_mode("video"),
        },
        "last_run": registry.last_chain_report(),
    }
