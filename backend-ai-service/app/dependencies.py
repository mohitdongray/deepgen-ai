"""FastAPI dependency accessors for app state."""

from fastapi import Request

from app.config import Settings
from app.core.http import HttpClient
from app.jobs.store import JobStore
from app.providers.registry import ProviderRegistry
from app.services.generation import GenerationService
from app.services.media import MediaService


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_job_store(request: Request) -> JobStore:
    return request.app.state.job_store


def get_registry(request: Request) -> ProviderRegistry:
    return request.app.state.registry


def get_generation_service(request: Request) -> GenerationService:
    return request.app.state.generation_service


def get_http_client(request: Request) -> HttpClient:
    return request.app.state.http_client


def get_media_service(request: Request) -> MediaService:
    return request.app.state.media_service
