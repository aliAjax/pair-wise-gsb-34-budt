"""简易固定窗口限流：按客户端 IP 计数，超限抛 RATE_LIMITED。"""
import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware

from src.config import settings
from src.constants.exceptions import AppError


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request, call_next):
        if not request.url.path.startswith("/health"):
            self._check(request.client.host if request.client else "anon")
        return await call_next(request)

    def _check(self, key: str):
        now = time.monotonic()
        window = settings.RATE_LIMIT_WINDOW_SECONDS
        hits = [t for t in self._hits[key] if now - t < window]
        if len(hits) >= settings.RATE_LIMIT_MAX_REQUESTS:
            raise AppError("RATE_LIMITED", status_code=429)
        hits.append(now)
        self._hits[key] = hits


rate_limit_middleware = RateLimitMiddleware
