from fastapi import APIRouter

from src.controllers.audit_log_controller import list_audit_log

router = APIRouter(prefix="/api/audit-log", tags=["AuditLog"])
router.get("")(list_audit_log)
