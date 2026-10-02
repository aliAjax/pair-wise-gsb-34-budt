import copy

from src.repositories import store


class HazardTicketRepository:
    def find_all(self):
        return store.table("hazardTicket")

    def find_by_id(self, ticket_id: int):
        return store.find_by_id("hazardTicket", ticket_id)

    def find_open_by_device(self, device_id: int):
        return [t for t in store.table("hazardTicket")
                if t["device_id"] == device_id and t["rectify_status"] != "CLOSED"]

    def create(self, row: dict) -> dict:
        row.setdefault("version", 1)
        return store.insert("hazardTicket", row)

    def close(self, ticket: dict, note: str) -> dict:
        ticket["rectify_status"] = "CLOSED"
        ticket["rectify_note"] = note
        ticket["closed_at"] = store.now_iso()
        ticket["version"] = ticket.get("version", 1) + 1
        return copy.deepcopy(ticket)
