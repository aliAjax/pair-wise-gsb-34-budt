from src.config.security import USERS, issue_token
from src.services.audit_service import audit_service


def login(payload):
    if payload.user_id not in USERS:
        from src.constants.exceptions import NotFoundError

        raise NotFoundError("用户")
    user = USERS[payload.user_id]
    audit_service.log(
        actor=user["name"], actor_id=payload.user_id, action="Auth.login",
        target_type="User", target_id=payload.user_id,
    )
    return {
        "token": issue_token(payload.user_id),
        "user": {"id": payload.user_id, "name": user["name"], "role": user["role"]},
    }


def list_audit_logs():
    return audit_service.list()
