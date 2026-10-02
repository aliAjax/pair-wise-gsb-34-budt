"""RBAC 依赖：route/controller 通过 Depends(require_roles(...)) 声明角色。

- 审计员（AUDITOR）在任何写接口都会被拒绝（只读角色）。
- 代巡检员补录由 service 层基于任务归属二次校验（PROXY_FILL_DENIED）。
"""
from fastapi import Depends, Request

from src.constants.exceptions import AuthError, RBACError


def current_user(request: Request) -> dict:
    user = getattr(request.state, "user", None)
    if user is None:
        raise AuthError("AUTH_REQUIRED")
    return user


def require_roles(*roles: str):
    def checker(user: dict = Depends(current_user)) -> dict:
        if user["role"] not in roles:
            raise RBACError("RBAC_DENIED")
        return user

    return checker
