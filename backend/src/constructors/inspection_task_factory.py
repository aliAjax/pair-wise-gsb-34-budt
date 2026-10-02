from src.constants.inspection_status import InspectionStatus


def create_inspection_task_dto(**overrides):
    row = {
        "id": 0,
        "building_id": 1,
        "inspector_id": 1,
        "plan_date": "",
        "task_type": "MONTHLY",
        "status": InspectionStatus[0],
        "checklist_version": "CL-2026-09",
        "finished_at": None,
    }
    row.update(overrides)
    return row
