from src.db import db


class InspectionResultRepository:
    def find_all(self):
        return db.table("inspectionResult")

    def get(self, result_id: int):
        return next((r for r in db.table("inspectionResult") if r["id"] == result_id), None)

    def get_by_client_uuid(self, client_uuid: str):
        return next(
            (r for r in db.table("inspectionResult") if r.get("client_uuid") == client_uuid),
            None,
        )

    def list_by_task(self, task_id: int):
        return [r for r in db.table("inspectionResult") if r["task_id"] == task_id]

    def list_by_device(self, device_id: int, only_valid: bool = False):
        rows = [r for r in db.table("inspectionResult") if r["device_id"] == device_id]
        return [r for r in rows if r["valid"]] if only_valid else rows

    def add(self, row: dict):
        db.table("inspectionResult").append(row)
        return row

    def invalidate(self, result_ids: list[int], reason: str):
        for row in db.table("inspectionResult"):
            if row["id"] in result_ids:
                row["valid"] = False
                row["invalid_reason"] = reason
