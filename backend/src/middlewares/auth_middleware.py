from fastapi.responses import JSONResponse

from src.constants.error_codes import ERROR_CODES
from src.services.auth_service import decode_token

_PUBLIC_PATHS = {"/health", "/api/auth/login"}
_PUBLIC_PREFIXES = ("/openapi.json", "/docs", "/redoc")


async def auth_middleware(request, call_next):
    path = request.url.path
    if path in _PUBLIC_PATHS or path.startswith(_PUBLIC_PREFIXES):
        request.state.user = None
        return await call_next(request)

    header = request.headers.get("authorization", "")
    token = header[7:] if header.lower().startswith("bearer ") else ""
    user = decode_token(token) if token else None
    if user is None:
        return JSONResponse(status_code=401, content={
            "code": ERROR_CODES["AUTH_REQUIRED"], "message": "missing or invalid token",
        })
    request.state.user = user
    return await call_next(request)
