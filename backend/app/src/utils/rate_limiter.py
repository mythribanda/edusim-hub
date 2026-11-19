import time
import threading
from collections import defaultdict, deque
from typing import Optional, Callable
from fastapi import Request, HTTPException, status

from app.src.utils.auth import decode_token


class InMemoryRateLimiter:
    """
    High-performance thread-safe sliding window rate limiter.
    Limits requests per client IP or authenticated User ID.
    """

    def __init__(self):
        self._lock = threading.Lock()
        # Map: tier_name -> key (ip or user_id) -> deque of request timestamps
        self._records = defaultdict(lambda: defaultdict(deque))

    def _get_identifier(self, request: Request) -> str:
        # Check if caller has a valid Bearer token (per-user rate limit)
        auth = request.headers.get("authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1].strip()
            payload = decode_token(token)
            if payload and payload.get("sub"):
                return f"user:{payload['sub']}"

        # Fallback to client IP (per-IP rate limit)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # First IP in X-Forwarded-For is client
            client_ip = forwarded_for.split(",")[0].strip()
            if client_ip:
                return f"ip:{client_ip}"

        if request.client and request.client.host:
            return f"ip:{request.client.host}"

        return "ip:unknown"

    def check_rate_limit(
        self,
        request: Request,
        tier: str,
        max_requests: int,
        window_seconds: float
    ) -> None:
        key = self._get_identifier(request)
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            timestamps = self._records[tier][key]

            # Purge timestamps outside the sliding window
            while timestamps and timestamps[0] <= window_start:
                timestamps.popleft()

            if len(timestamps) >= max_requests:
                oldest = timestamps[0]
                retry_after = max(1, int(oldest + window_seconds - now))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded for tier '{tier}'. Maximum {max_requests} requests per {int(window_seconds)}s. Try again in {retry_after}s.",
                    headers={"Retry-After": str(retry_after)}
                )

            timestamps.append(now)

    def reset(self):
        with self._lock:
            self._records.clear()


limiter = InMemoryRateLimiter()


def rate_limit(max_requests: int = 60, window_seconds: float = 60.0, tier: str = "general") -> Callable:
    """FastAPI Dependency for rate limiting."""
    async def dependency(request: Request):
        limiter.check_rate_limit(request, tier=tier, max_requests=max_requests, window_seconds=window_seconds)
    return dependency


# Standard preconfigured tiers
rate_limit_auth = rate_limit(max_requests=5, window_seconds=60.0, tier="auth")
rate_limit_ai = rate_limit(max_requests=15, window_seconds=60.0, tier="ai_expensive")
rate_limit_general = rate_limit(max_requests=100, window_seconds=60.0, tier="general")
