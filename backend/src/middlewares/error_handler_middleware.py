"""全局错误处理：AppError 转统一错误体，service/controller 各自仍可包装再抛。"""
from starlette.middleware.base import BaseHTTPMiddleware

from src.constants.error_codes import ERROR_CODES
from src.constants.exceptions import AppError


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            return await call_next(request)
        except AppError as exc:
            return _json(exc.status_code, {"code": exc.code, "message": exc.message})
        except Exception as exc:  # noqa: BLE001 - 最后一道兜底，禁止裸吞
            return _json(500, {"code": ERROR_CODES["INTERNAL_ERROR"], "message": str(exc)})


def _json(status_code: int, payload: dict):
    from starlette.responses import JSONResponse

    return JSONResponse(status_code=status_code, content=payload)


error_handler_middleware = ErrorHandlerMiddleware


def to_error_payload(exc):
    return {"code": getattr(exc, "code", ERROR_CODES["INTERNAL_ERROR"]), "message": str(exc)}
