import copy

from src.repositories import store


class InspectionResultRepository:
    def find_all(self):
        return store.table("inspectionResult")

    def find_by_id(self, result_id: int):
        return store.find_by_id("inspectionResult", result_id)

    def list_by_device(self, device_id: int):
        return [r for r in store.table("inspectionResult") if r["device_id"] == device_id]

    def latest_effective_by_device(self, device_id: int):
        effective = [r for r in self.list_by_device(device_id) if r.get("effective")]
        return effective[-1] if effective else None

    def create(self, row: dict) -> dict:
        row.setdefault("effective", True)
        row.setdefault("version", 1)
        row.setdefault("reviewed_at", None)
        row.setdefault("hazard_ticket_id", None)
        return store.insert("inspectionResult", row)

    def supersede_for_device(self, device_id: int) -> int:
        """Invalidate previous effective results of a device; returns count."""
        count = 0
        for row in self.list_by_device(device_id):
            if row.get("effective"):
                row["effective"] = False
                row["version"] = row.get("version", 1) + 1
                count += 1
        return count

    def mark_effective(self, result: dict, effective: bool) -> dict:
        result["effective"] = effective
        result["version"] = result.get("version", 1) + 1
        return copy.deepcopy(result)

    def bind_hazard_ticket(self, result: dict, ticket_id: int) -> dict:
        result["hazard_ticket_id"] = ticket_id
        result["version"] = result.get("version", 1) + 1
        return copy.deepcopy(result)
