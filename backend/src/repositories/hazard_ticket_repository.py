from src.db import db


class HazardTicketRepository:
    def find_all(self):
        return db.table("hazardTicket")

    def get(self, ticket_id: int):
        return next((r for r in db.table("hazardTicket") if r["id"] == ticket_id), None)

    def list_open_by_result(self, result_id: int):
        return [
            r
            for r in db.table("hazardTicket")
            if r["result_id"] == result_id and r["rectify_status"] != "CLOSED"
        ]

    def has_closed_ticket(self, result_id: int) -> bool:
        return any(
            r["result_id"] == result_id and r["rectify_status"] == "CLOSED"
            for r in db.table("hazardTicket")
        )

    def update(self, ticket_id: int, **fields):
        row = self.get(ticket_id)
        if row is not None:
            row.update(fields)
        return row
