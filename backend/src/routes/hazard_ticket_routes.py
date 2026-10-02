from fastapi import APIRouter, Depends

from src.constants.user_role import HAZARD_WRITE_ROLES
from src.controllers.hazard_ticket_controller import close_hazard_ticket, list_hazard_ticket
from src.middlewares.rbac_middleware import allow_roles

router = APIRouter(prefix="/api/hazard-ticket", tags=["HazardTicket"])
router.get("")(list_hazard_ticket)
router.post("/{ticket_id}/close",
            dependencies=[Depends(allow_roles(*HAZARD_WRITE_ROLES))])(close_hazard_ticket)
