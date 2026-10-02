"""Business exception shared by controllers and services.

Both the service layer and the controller layer wrap errors explicitly
(see controllers' try/except) instead of one global swallow point.
"""

from src.constants.error_codes import ERROR_CODES
from src.constants.error_messages import ERROR_MESSAGES


class BusinessError(Exception):
    def __init__(self, code: str, http_status: int = 400, **params):
        self.code = code if code in ERROR_CODES else ERROR_CODES["INTERNAL_ERROR"]
        self.http_status = http_status
        template = ERROR_MESSAGES.get(self.code, code)
        self.message = template.format(**params) if params else template
        super().__init__(self.message)

    def to_payload(self) -> dict:
        return {"code": self.code, "message": self.message}
