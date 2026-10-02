from src.db import db


class InspectionTaskRepository:
    def find_all(self):
        return db.table("inspectionTask")

    def get(self, task_id: int):
        return next((r for r in db.table("inspectionTask") if r["id"] == task_id), None)

    def update(self, task_id: int, **fields):
        row = self.get(task_id)
        if row is not None:
            row.update(fields)
        return row
