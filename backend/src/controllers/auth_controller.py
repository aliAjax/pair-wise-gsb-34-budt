from src.services.auth_service import authenticate, issue_token
from src.utils.errors import BusinessError


def login(payload: dict):
    user = authenticate(payload.get("username", ""), payload.get("password", ""))
    if user is None:
        raise BusinessError("AUTH_REQUIRED", 401)
    token = issue_token(user)
    return {"token": token, "user": {"id": user["id"], "name": user["name"],
                                     "username": user["username"], "role": user["role"]}}
