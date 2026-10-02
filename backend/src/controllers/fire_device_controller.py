from fastapi import Body, Depends

from src.middlewares.rbac_middleware import current_user
from src.services.fire_device_service import FireDeviceService

service = FireDeviceService()


def list_fire_device():
    return service.list()


def update_fire_device_status(device_id: int, payload: dict = Body(...),
                              actor: dict = Depends(current_user)):
    return service.update_status(device_id, payload, actor)
