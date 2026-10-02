from fastapi.responses import JSONResponse

from src.constants.error_codes import ERROR_CODES
from src.constants.error_messages import ERROR_MESSAGES
from src.utils.errors import BusinessError


def to_error_payload(exc) -> dict:
    return {"code": getattr(exc, "code", ERROR_CODES["INTERNAL_ERROR"]), "message": str(exc)}


def register_exception_handlers(app) -> None:
    @app.exception_handler(BusinessError)
    async def handle_business_error(_request, exc: BusinessError):
        # Service/controller wrapped business error, preserved HTTP status.
        return JSONResponse(status_code=exc.http_status, content=exc.to_payload())

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_request, exc: Exception):
        # Final safety net; services and controllers wrap expected errors themselves.
        return JSONResponse(status_code=500, content={
            "code": ERROR_CODES["INTERNAL_ERROR"],
            "message": ERROR_MESSAGES["INTERNAL_ERROR"],
        })
