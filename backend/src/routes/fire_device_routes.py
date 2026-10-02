from fastapi import APIRouter, Depends

from src.constants.user_role import UserRole
from src.controllers.fire_device_controller import (
    list_fire_device, device_history, update_device_status,
)
from src.middlewares.rbac_middleware import require_roles
from src.types.fire_device_payload import DeviceStatusPayload

router = APIRouter(prefix="/api/fire-device", tags=["FireDevice"])

_supervisor = require_roles(UserRole.SUPERVISOR)

router.get("")(list_fire_device)
router.get("/{device_id}/history")(device_history)


@router.patch("/{device_id}/status")
def _update_status(device_id: int, payload: DeviceStatusPayload,
                   actor=Depends(_supervisor)):
    return update_device_status(device_id, payload, actor)
