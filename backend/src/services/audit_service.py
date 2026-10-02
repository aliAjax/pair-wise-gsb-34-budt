"""操作日志服务：所有写操作经此落库，模板取自 constants.log_templates。"""
from src.constants.log_templates import render
from src.db import db
from src.repositories.audit_log_repository import AuditLogRepository


class AuditService:
    def __init__(self):
        self.repo = AuditLogRepository()

    def log(self, actor: str, action: str, target_type: str, target_id, template: str | None = None,
            actor_id: int | None = None, **template_args):
        message = render(template, **template_args) if template else action
        row = {
            "id": db.next_id("auditLog"),
            "actor": actor,
            "actor_id": actor_id,
            "action": action,
            "target_type": target_type,
            "target_id": str(target_id),
            "message": message,
            "created_at": _now(),
        }
        return self.repo.add(row)

    def list(self):
        return self.repo.find_all()


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


audit_service = AuditService()
