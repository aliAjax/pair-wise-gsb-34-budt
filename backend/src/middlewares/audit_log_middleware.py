"""业务写操作的审计留痕在 service 层完成（见 services/audit_service）。

保留 HTTP 中间件钩子，便于后续把慢请求/异常也纳入审计流。
"""
from starlette.middleware.base import BaseHTTPMiddleware


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        return await call_next(request)


audit_log_middleware = AuditLogMiddleware
