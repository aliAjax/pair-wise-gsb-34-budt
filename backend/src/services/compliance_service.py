"""楼栋达标率：设备台账/复核裁决后必须重算，结果写回 building 并供总览复用。"""
from src.constants.device_status import DeviceStatus
from src.constants.result_status import ResultStatus
from src.repositories.building_repository import BuildingRepository
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.repositories.review_item_repository import ReviewItemRepository
from src.constructors.building_factory import create_building_overview_dto
from src.services.audit_service import audit_service


class ComplianceService:
    def __init__(self):
        self.building_repo = BuildingRepository()
        self.device_repo = FireDeviceRepository()
        self.result_repo = InspectionResultRepository()
        self.review_repo = ReviewItemRepository()

    def _device_qualified(self, device: dict) -> bool:
        # 设备本身故障/整改中/报废直接不达标
        if device["status"] != DeviceStatus.NORMAL:
            return False
        valid = [r for r in self.result_repo.list_by_device(device["id"], only_valid=True)
                 if r["result_status"] in (ResultStatus.QUALIFIED, ResultStatus.ABNORMAL)]
        if not valid:
            return False
        latest = max(valid, key=lambda r: r["recorded_at"])
        return latest["result_status"] == ResultStatus.QUALIFIED

    def recompute_building(self, building_id: int, *, actor: dict | None = None) -> dict:
        building = self.building_repo.get(building_id)
        devices = self.device_repo.list_by_building(building_id)
        qualified = sum(1 for d in devices if self._device_qualified(d))
        total = len(devices)
        new_rate = round(qualified / total, 4) if total else 0.0
        old_rate = building.get("compliance_rate")
        building["compliance_rate"] = new_rate
        building["qualified_devices"] = qualified
        building["rate_computed_at"] = _now()
        audit_service.log(
            actor=actor["name"] if actor else "system",
            actor_id=actor["id"] if actor else None,
            action="Building.recompute_rate", target_type="Building", target_id=building_id,
            template="Building.recompute_rate", building_id=building_id,
            old_rate=old_rate if old_rate is not None else 0.0, new_rate=new_rate,
        )
        return building

    def overview(self):
        rows = []
        for building in self.building_repo.find_all():
            self.recompute_building(building["id"])
            devices = self.device_repo.list_by_building(building["id"])
            qualified = sum(1 for d in devices if self._device_qualified(d))
            pending = len([r for r in self.review_repo.list_pending()
                           if r["building_id"] == building["id"]])
            rows.append(create_building_overview_dto(
                building, building["compliance_rate"], len(devices), qualified, pending,
            ))
        return rows


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


compliance_service = ComplianceService()
