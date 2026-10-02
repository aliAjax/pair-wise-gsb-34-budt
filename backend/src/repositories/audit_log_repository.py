from src.constants.log_templates import render_log
from src.repositories import store


class AuditLogRepository:
    def find_all(self):
        return store.table("auditLog")

    def add(self, entity: str, action: str, actor: dict, **params):
        row = {
            "id": store.next_id("auditLog"),
            "entity": entity,
            "action": action,
            "actor_id": actor.get("id"),
            "actor_name": actor.get("name", ""),
            "actor_role": actor.get("role", ""),
            "message": render_log(entity, action, actor=actor.get("name", actor.get("id")), **params),
            "created_at": store.now_iso(),
        }
        return store.insert("auditLog", row)


audit_log_repository = AuditLogRepository()
