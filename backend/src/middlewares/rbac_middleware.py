"""RBAC dependency used on every write route.

Auditors are read-only everywhere. The proxy-backfill rule (an actor
submitting another inspector's task) is enforced in the sync service.
"""

from fastapi import Depends, Request

from src.constants.user_role import READ_ONLY_ROLES
from src.utils.errors import BusinessError


def current_user(request: Request) -> dict:
    return request.state.user


def allow_roles(*roles: str):
    def dependency(request: Request) -> dict:
        user = request.state.user
        if user.get("role") in READ_ONLY_ROLES:
            raise BusinessError("RBAC_DENIED", http_status=403)
        if roles and user.get("role") not in roles:
            raise BusinessError("RBAC_DENIED", http_status=403)
        return user
    return dependency
