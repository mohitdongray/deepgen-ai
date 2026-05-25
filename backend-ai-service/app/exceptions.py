"""
Custom exception hierarchy for DeepGen.

Keeping all exceptions in one module eliminates the risk of import cycles
that previously occurred when providers imported from app.core and app.core
imported from providers.
"""

from __future__ import annotations

from typing import Any


class DeepGenError(Exception):
    """Root exception for all application errors."""

    def __init__(self, message: str, details: Any = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details


class JobNotFoundError(DeepGenError):
    def __init__(self, job_id: str) -> None:
        super().__init__(f"Job '{job_id}' not found")
        self.job_id = job_id


class ConsentRequiredError(DeepGenError):
    def __init__(self) -> None:
        super().__init__("Consent is required to proceed with generation")


class ProviderError(DeepGenError):
    """A provider returned an error response."""

    def __init__(self, message: str, provider: str = "") -> None:
        super().__init__(message)
        self.provider = provider


class ProviderUnavailableError(ProviderError):
    """Provider is not configured (missing API key, etc.)."""


class ProviderTimeoutError(ProviderError):
    """Provider did not respond within the allowed time."""


class AllProvidersFailedError(DeepGenError):
    """Every provider in the chain failed."""

    def __init__(self, errors: list[str]) -> None:
        super().__init__("All providers failed", details=errors)
        self.errors = errors

    def __str__(self) -> str:
        return f"AllProvidersFailedError: {'; '.join(self.errors)}"