"""JWT 签发/校验。认证用户写死为种子里的演示账号（本地数据源，禁止第三方）。"""
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from src.config import settings
from src.constants.error_codes import ERROR_CODES
from src.constants.user_role import UserRole

# id -> {name, role}，与 seed.py 保持一致
USERS = {
    1: {"name": "王巡检", "role": UserRole.INSPECTOR},
    2: {"name": "李巡检", "role": UserRole.INSPECTOR},
    3: {"name": "赵维保", "role": UserRole.MAINTAINER},
    4: {"name": "钱主管", "role": UserRole.SUPERVISOR},
    5: {"name": "孙审计", "role": UserRole.AUDITOR},
}


def issue_token(user_id: int) -> str:
    user = USERS[user_id]
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "name": user["name"],
        "role": user["role"],
        "iat": int(now.timestamp()),
        "exp": now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        from src.constants.exceptions import AuthError

        raise AuthError(ERROR_CODES["AUTH_INVALID"]) from exc
