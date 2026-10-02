from fastapi import APIRouter, Depends

from src.constants.user_role import UserRole
from src.controllers.hazard_ticket_controller import (
    list_hazard_ticket, dispatch_hazard_ticket, close_hazard_ticket,
)
from src.middlewares.rbac_middleware import require_roles
from src.types.hazard_ticket_payload import HazardTicketPayload, TicketClosePayload

router = APIRouter(prefix="/api/hazard-ticket", tags=["HazardTicket"])

_supervisor = require_roles(UserRole.SUPERVISOR)
_rectifier = require_roles(UserRole.MAINTAINER, UserRole.SUPERVISOR)

router.get("")(list_hazard_ticket)


@router.post("")
def _dispatch(payload: HazardTicketPayload, actor=Depends(_supervisor)):
    return dispatch_hazard_ticket(payload, actor)


@router.post("/{ticket_id}/close")
def _close(ticket_id: int, payload: TicketClosePayload, actor=Depends(_rectifier)):
    return close_hazard_ticket(ticket_id, payload, actor)
