from src.repositories.audit_log_repository import audit_log_repository
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.utils.errors import BusinessError


class HazardTicketService:
    def __init__(self):
        self.repo = HazardTicketRepository()

    def list(self):
        return self.repo.find_all()

    def close_ticket(self, ticket_id: int, payload: dict, actor: dict) -> dict:
        ticket = self.repo.find_by_id(ticket_id)
        if ticket is None:
            raise BusinessError("VALIDATION_FAILED", 404)
        if ticket["rectify_status"] == "CLOSED":
            return dict(ticket)
        note = payload.get("rectify_note", "复验通过")
        old_status = ticket["rectify_status"]
        self.repo.close(ticket, note)
        audit_log_repository.add(
            "HazardTicket", "HazardTicket.status", actor,
            entity_id=ticket_id, old_status=old_status, status="CLOSED")
        return dict(ticket)
