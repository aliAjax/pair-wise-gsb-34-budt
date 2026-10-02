from fastapi import Body, Depends

from src.middlewares.rbac_middleware import current_user
from src.services.hazard_ticket_service import HazardTicketService

service = HazardTicketService()


def list_hazard_ticket():
    return service.list()


def close_hazard_ticket(ticket_id: int, payload: dict = Body(...),
                        actor: dict = Depends(current_user)):
    return service.close_ticket(ticket_id, payload, actor)
