"""JWT 认证中间件：/health、/api/auth/login 与文档路径免鉴权。

审计员等所有角色的身份都从 Authorization: Bearer <token> 解析；
解析失败统一抛 AUTH_INVALID，由 error_handler_middleware 包装。
"""
from starlette.middleware.base import BaseHTTPMiddleware

from src.config.security import decode_token
from src.constants.exceptions import AuthError

PUBLIC_PATH_PREFIXES = ("/health", "/api/auth/login", "/docs", "/openapi.json", "/redoc")


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.url.path
        is_public = any(path.startswith(p) for p in PUBLIC_PATH_PREFIXES)
        if is_public or request.method == "OPTIONS":
            request.state.user = None
            return await call_next(request)

        # 读接口允许匿名访问（台账/总览可浏览）；所有写操作必须登录
        if request.method == "GET":
            request.state.user = _optional_user(request)
            return await call_next(request)

        request.state.user = _required_user(request)
        return await call_next(request)


def _optional_user(request):
    header = request.headers.get("authorization")
    if not header or not header.startswith("Bearer "):
        return None
    return _claims(header[len("Bearer "):])


def _required_user(request):
    header = request.headers.get("authorization")
    if not header or not header.startswith("Bearer "):
        raise AuthError("AUTH_REQUIRED")
    return _claims(header[len("Bearer "):])


def _claims(token: str) -> dict:
    payload = decode_token(token)
    return {
        "id": int(payload["sub"]),
        "name": payload.get("name", payload["sub"]),
        "role": payload["role"],
    }


auth_middleware = AuthMiddleware
