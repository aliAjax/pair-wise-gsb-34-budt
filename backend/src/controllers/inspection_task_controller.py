from src.services.inspection_task_service import inspection_task_service


def list_inspection_task(building_id: int | None = None):
    return inspection_task_service.list(building_id=building_id)


def create_inspection_task(payload, actor: dict):
    return inspection_task_service.create(payload, actor)


def claim_inspection_task(task_id: int, actor: dict):
    return inspection_task_service.claim(task_id, actor)


def review_inspection_task(task_id: int, approved: bool, actor: dict):
    return inspection_task_service.review(task_id, actor, approved)
