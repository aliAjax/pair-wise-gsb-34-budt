from src.db import db


class FireDeviceRepository:
    def find_all(self):
        return db.table("fireDevice")

    def get(self, device_id: int):
        return next((r for r in db.table("fireDevice") if r["id"] == device_id), None)

    def get_by_code(self, device_code: str):
        return next((r for r in db.table("fireDevice") if r["device_code"] == device_code), None)

    def list_by_building(self, building_id: int):
        return [r for r in db.table("fireDevice") if r["building_id"] == building_id]

    def update_status(self, device_id: int, status: str, changed_at: str):
        row = self.get(device_id)
        if row is None:
            return None
        old = {"status": row["status"], "row_version": row["row_version"]}
        row["status"] = status
        row["status_changed_at"] = changed_at
        row["row_version"] += 1
        return row, old
