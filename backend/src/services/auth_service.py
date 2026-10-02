from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from src.config.settings import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, JWT_SECRET
from src.repositories import store


def issue_token(user: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user["id"]), "role": user["role"], "name": user["name"], "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def authenticate(username: str, password: str):
    return next((u for u in store.table("user")
                 if u["username"] == username and u["password"] == password), None)


def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None
    user_id = int(payload.get("sub", 0))
    return store.find_by_id("user", user_id) or {
        "id": user_id, "username": payload.get("sub"), "name": payload.get("name", ""),
        "role": payload.get("role", "INSPECTOR"),
    }
