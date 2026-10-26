import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, status


class SlidingWindowLimiter:
    """In-memory per-key limiter. Fine for a single instance (the free hosting
    tier runs one); a multi-instance deployment would need a shared store."""

    def __init__(self, max_calls: int, window_seconds: float):
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self._calls: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            calls = self._calls[key]
            while calls and now - calls[0] > self.window_seconds:
                calls.popleft()
            if len(calls) >= self.max_calls:
                retry_after = max(1, int(self.window_seconds - (now - calls[0])) + 1)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Trop de demandes de conseil. Réessayez dans quelques instants.",
                    headers={"Retry-After": str(retry_after)},
                )
            calls.append(now)

    def reset(self) -> None:
        with self._lock:
            self._calls.clear()


# The LLM quota is shared by every user of the free Groq key, and sign-up is open.
recommendation_limiter = SlidingWindowLimiter(max_calls=10, window_seconds=60)
