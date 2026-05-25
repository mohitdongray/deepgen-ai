"""Async retry utilities with exponential backoff."""

import asyncio
import logging
from typing import Awaitable, Callable, TypeVar, Tuple, Type

logger = logging.getLogger(__name__)

T = TypeVar("T")


async def with_retry(
    operation: Callable[[], Awaitable[T]],
    *,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    retryable_exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    on_retry: Callable[[int, BaseException], None] | None = None,
) -> T:
    last_error: BaseException | None = None

    for attempt in range(1, max_attempts + 1):
        try:
            return await operation()
        except retryable_exceptions as exc:
            last_error = exc
            if attempt >= max_attempts:
                break
            delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
            logger.warning(
                "Retry %s/%s after %ss: %s",
                attempt,
                max_attempts,
                delay,
                exc,
            )
            if on_retry:
                on_retry(attempt, exc)
            await asyncio.sleep(delay)

    assert last_error is not None
    raise last_error
