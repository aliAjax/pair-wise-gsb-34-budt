from src.services.hazard_ticket_service import hazard_ticket_service


def list_hazard_ticket(status: str | None = None):
    return hazard_ticket_service.list(status=status)


def dispatch_hazard_ticket(payload, actor: dict):
    return hazard_ticket_service.dispatch(payload, actor)


def close_hazard_ticket(ticket_id: int, payload, actor: dict):
    return hazard_ticket_service.close(ticket_id, payload, actor)
