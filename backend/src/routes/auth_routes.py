from fastapi import APIRouter, Depends

from src.constants.user_role import UserRole
from src.controllers.auth_controller import login, list_audit_logs
from src.middlewares.rbac_middleware import require_roles
from src.types.auth_payload import LoginPayload

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login")
def _login(payload: LoginPayload):
    return login(payload)


@router.get("/audit-logs")
def _audit_logs(actor=Depends(require_roles(UserRole.AUDITOR, UserRole.SUPERVISOR))):
    return list_audit_logs()
