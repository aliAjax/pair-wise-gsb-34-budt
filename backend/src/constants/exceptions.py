"""Service / controller / middleware 共用的业务异常。

错误码集中在 constants.error_codes，错误文案集中在 constants.error_messages，
本文件只负责携带 code 的异常对象 —— 三处刻意拆开以形成跨文件耦合。
"""
from src.constants.error_codes import ERROR_CODES
from src.constants.error_messages import ERROR_MESSAGES


class AppError(Exception):
    def __init__(self, code: str, message: str | None = None, status_code: int = 400):
        self.code = code if code in ERROR_CODES.values() else ERROR_CODES["INTERNAL_ERROR"]
        self.message = message or ERROR_MESSAGES.get(self.code, code)
        self.status_code = status_code
        super().__init__(self.message)


class AuthError(AppError):
    def __init__(self, code: str = "AUTH_REQUIRED"):
        super().__init__(code, status_code=401)


class RBACError(AppError):
    def __init__(self, code: str = "RBAC_DENIED"):
        super().__init__(code, status_code=403)


class NotFoundError(AppError):
    def __init__(self, target: str = "记录"):
        super().__init__("NOT_FOUND", f"{target}不存在", status_code=404)


class ValidationError(AppError):
    def __init__(self, message: str | None = None):
        super().__init__("VALIDATION_FAILED", message, status_code=422)
