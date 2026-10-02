"""HTTP 访问日志（区别于业务操作日志 audit_service）。"""
from starlette.middleware.base import BaseHTTPMiddleware


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = __import__("time").monotonic()
        response = await call_next(request)
        elapsed_ms = int((__import__("time").monotonic() - start) * 1000)
        print(f"[http] {request.method} {request.url.path} -> {response.status_code} {elapsed_ms}ms")
        return response


request_logger_middleware = RequestLoggerMiddleware
