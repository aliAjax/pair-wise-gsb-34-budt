import copy

from src.repositories import store


class FireDeviceRepository:
    def find_all(self):
        return store.table("fireDevice")

    def find_by_id(self, device_id: int):
        return store.find_by_id("fireDevice", device_id)

    def list_by_building(self, building_id: int):
        return [d for d in store.table("fireDevice") if d["building_id"] == building_id]

    def update_status(self, device: dict, status: str) -> dict:
        device["status"] = status
        device["version"] = device.get("version", 1) + 1
        device["updated_at"] = store.now_iso()
        return copy.deepcopy(device)
