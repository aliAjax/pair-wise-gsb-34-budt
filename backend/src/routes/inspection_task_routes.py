from fastapi import APIRouter, Depends

from src.constants.user_role import UserRole
from src.controllers.inspection_task_controller import (
    list_inspection_task, create_inspection_task, claim_inspection_task,
    review_inspection_task,
)
from src.middlewares.rbac_middleware import require_roles
from src.types.inspection_task_payload import InspectionTaskPayload

router = APIRouter(prefix="/api/inspection-task", tags=["InspectionTask"])

_supervisor = require_roles(UserRole.SUPERVISOR)
_inspector = require_roles(UserRole.INSPECTOR)

router.get("")(list_inspection_task)


@router.post("")
def _create(payload: InspectionTaskPayload, actor=Depends(_supervisor)):
    return create_inspection_task(payload, actor)


@router.post("/{task_id}/claim")
def _claim(task_id: int, actor=Depends(_inspector)):
    return claim_inspection_task(task_id, actor)


@router.post("/{task_id}/review")
def _review(task_id: int, approved: bool = True, actor=Depends(_supervisor)):
    return review_inspection_task(task_id, approved, actor)
