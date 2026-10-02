from fastapi import APIRouter, Depends

from src.constants.user_role import UserRole
from src.controllers.inspection_result_controller import (
    list_inspection_result, sync_inspection_results,
)
from src.middlewares.rbac_middleware import require_roles
from src.types.inspection_result_payload import SyncBatchPayload

router = APIRouter(prefix="/api/inspection-result", tags=["InspectionResult"])

_inspector = require_roles(UserRole.INSPECTOR)

router.get("")(list_inspection_result)


@router.post("/sync")
def _sync(payload: SyncBatchPayload, actor=Depends(_inspector)):
    # 仅巡检员本人可提交检查结果；审计员只读、其他角色代补录一律拒绝
    return sync_inspection_results(payload, actor)
