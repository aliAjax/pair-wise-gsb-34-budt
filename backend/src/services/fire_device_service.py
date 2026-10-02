from src.constants.sync_status import DeviceStatus
from src.repositories.audit_log_repository import audit_log_repository
from src.repositories.building_repository import BuildingRepository
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.services.compliance_service import compliance_service
from src.utils.errors import BusinessError


class FireDeviceService:
    def __init__(self):
        self.repo = FireDeviceRepository()
        self.result_repo = InspectionResultRepository()
        self.building_repo = BuildingRepository()

    def list(self):
        evaluation = compliance_service.device_compliance_map()
        rows = []
        for device in self.repo.find_all():
            row = dict(device)
            row["compliance"] = evaluation.get(device["id"])
            rows.append(row)
        return rows

    def update_status(self, device_id: int, payload: dict, actor: dict) -> dict:
        device = self.repo.find_by_id(device_id)
        if device is None:
            raise BusinessError("DEVICE_NOT_FOUND", 404, device_id=device_id)
        status = payload.get("status")
        if status not in DeviceStatus:
            raise BusinessError("VALIDATION_FAILED", 400)
        old_status = device["status"]
        if status == old_status:
            return dict(device)

        previous_rate = compliance_service.building_rate(device["building_id"])["compliance_rate"]
        # 主管更新设备状态：该设备历史巡检结果立即失效，达标率随后重算。
        invalidated = self.result_repo.supersede_for_device(device_id)
        self.repo.update_status(device, status)
        audit_log_repository.add(
            "FireDevice", "FireDevice.status", actor,
            entity_id=device_id, device_code=device["device_code"],
            old_status=old_status, status=status)
        if invalidated:
            audit_log_repository.add(
                "InspectionResult", "InspectionResult.status", actor,
                entity_id=device_id, superseded=invalidated)

        # 旧巡检结果失效后立即重算并留痕楼栋达标率（台账与总览同源）。
        building = self.building_repo.find_by_id(device["building_id"])
        rate = compliance_service.building_rate(device["building_id"])
        audit_log_repository.add(
            "Building", "Building.status", actor,
            entity_id=device["building_id"], name=building["name"] if building else device["building_id"],
            old_rate=previous_rate, rate=rate["compliance_rate"])

        row = dict(device)
        row["compliance"] = compliance_service.evaluate_device(device)
        return row
