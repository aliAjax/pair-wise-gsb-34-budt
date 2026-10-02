import copy

from src.repositories import store


class InspectionTaskRepository:
    def find_all(self):
        return store.table("inspectionTask")

    def find_by_id(self, task_id: int):
        return store.find_by_id("inspectionTask", task_id)

    def update_fields(self, task: dict, **fields) -> dict:
        task.update(fields)
        task["version"] = task.get("version", 1) + 1
        return copy.deepcopy(task)
