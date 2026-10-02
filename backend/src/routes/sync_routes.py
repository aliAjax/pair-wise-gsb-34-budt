from fastapi import APIRouter, Depends

from src.constants.user_role import INSPECTION_WRITE_ROLES, LEDGER_WRITE_ROLES
from src.controllers.sync_controller import (
    get_sync_batch,
    list_review_items,
    list_sync_batches,
    resolve_review_item,
    retry_sync_batch,
    submit_sync_batch,
)
from src.middlewares.rbac_middleware import allow_roles

router = APIRouter(prefix="/api", tags=["Sync"])

# 同步提交：巡检员（任务本人校验在 service）；审计员只读被 RBAC 拦截。
router.post("/sync/batches", dependencies=[Depends(allow_roles(*INSPECTION_WRITE_ROLES))])(submit_sync_batch)
router.post("/sync/batches/{batch_id}/retry",
            dependencies=[Depends(allow_roles(*INSPECTION_WRITE_ROLES))])(retry_sync_batch)
router.get("/sync/batches")(list_sync_batches)
router.get("/sync/batches/{batch_id}")(get_sync_batch)

# 冲突复核：设备台账与合规总览共用同一批 GET 数据；处置仅物业主管。
router.get("/reviews")(list_review_items)
router.post("/reviews/{review_id}/resolve",
            dependencies=[Depends(allow_roles(*LEDGER_WRITE_ROLES))])(resolve_review_item)
