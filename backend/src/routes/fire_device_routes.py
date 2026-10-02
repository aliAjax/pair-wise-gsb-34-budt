from fastapi import APIRouter, Depends

from src.constants.user_role import LEDGER_WRITE_ROLES
from src.controllers.fire_device_controller import list_fire_device, update_fire_device_status
from src.middlewares.rbac_middleware import allow_roles

router = APIRouter(prefix="/api/fire-device", tags=["FireDevice"])
router.get("")(list_fire_device)
# 物业主管更新设备状态（审计员/巡检员被拒），旧巡检结果失效并触发楼栋达标率重算。
router.patch("/{device_id}/status",
             dependencies=[Depends(allow_roles(*LEDGER_WRITE_ROLES))])(update_fire_device_status)
