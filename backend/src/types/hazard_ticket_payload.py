from pydantic import BaseModel


class HazardTicketPayload(BaseModel):
    result_id: int
    severity: str
    owner_id: int
    deadline: str


class TicketClosePayload(BaseModel):
    rectify_note: str
