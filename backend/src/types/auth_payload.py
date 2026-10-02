from pydantic import BaseModel


class LoginPayload(BaseModel):
    user_id: int
