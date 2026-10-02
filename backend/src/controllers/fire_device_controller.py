from src.services.fire_device_service import fire_device_service


def list_fire_device(building_id: int | None = None):
    return fire_device_service.list(building_id=building_id)


def device_history(device_id: int):
    return fire_device_service.history(device_id)


def update_device_status(device_id: int, payload, actor: dict):
    return fire_device_service.update_status(
        device_id, payload.status, actor,
        expected_version=payload.expected_version, note=payload.note,
    )
