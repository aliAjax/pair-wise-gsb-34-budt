from pydantic import BaseModel

from src.constants.device_status import DeviceStatus


class FireDevicePayload(BaseModel):
    building_id: int
    device_code: str
    device_type: str
    floor: str
    location_desc: str
    install_date: str
    status: str = DeviceStatus.NORMAL
    next_maintenance_at: str


class DeviceStatusPayload(BaseModel):
    status: str
    expected_version: int | None = None
    note: str | None = None
