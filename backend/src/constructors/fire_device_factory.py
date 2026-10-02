from src.constants.device_status import DeviceStatus


def create_fire_device_dto(**overrides):
    row = {
        "id": 0,
        "building_id": 1,
        "device_code": "",
        "device_type": "EXTINGUISHER",
        "floor": "1F",
        "location_desc": "",
        "install_date": "",
        "status": DeviceStatus.NORMAL,
        "next_maintenance_at": "",
        "status_changed_at": None,
        "row_version": 1,
    }
    row.update(overrides)
    return row
