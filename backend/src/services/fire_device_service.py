from datetime import datetime, timezone

from src.constants.device_status import DeviceStatus
from src.constants.exceptions import NotFoundError, ValidationError
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.services.audit_service import audit_service
from src.services.compliance_service import compliance_service
from src.services.review_item_service import review_item_service

_INVALID_REASON = "设备状态已由物业主管更新，旧巡检结果失效待复核"


class FireDeviceService:
    def __init__(self):
        self.repo = FireDeviceRepository()
        self.result_repo = InspectionResultRepository()

    def list(self, building_id: int | None = None):
        rows = self.repo.find_all()
        if building_id is not None:
            rows = [r for r in rows if r["building_id"] == building_id]
        return rows

    def history(self, device_id: int):
        device = self.repo.get(device_id)
        if device is None:
            raise NotFoundError("设备")
        return {
            "device": device,
            "results": self.result_repo.list_by_device(device_id),
            "reviews": [r for r in review_item_service.list() if r["device_id"] == device_id],
        }

    def update_status(self, device_id: int, status: str, actor: dict,
                      expected_version: int | None = None, note: str | None = None) -> dict:
        if status not in DeviceStatus.ALL:
            raise ValidationError(f"非法设备状态：{status}")
        device = self.repo.get(device_id)
        if device is None:
            raise NotFoundError("设备")
        if expected_version is not None and expected_version != device["row_version"]:
            from src.constants.exceptions import AppError

            raise AppError("STALE_VERSION", status_code=409)

        changed_at = datetime.now(timezone.utc).isoformat()
        old_status = device["status"]
        updated, old = self.repo.update_status(device_id, status, changed_at)

        audit_service.log(
            actor=actor["name"], actor_id=actor["id"], action="FireDevice.status",
            target_type="FireDevice", target_id=device_id, template="FireDevice.status",
            device_code=device["device_code"], old_status=old_status, new_status=status,
        )

        # 旧巡检结果失效：只让 recorded_at 早于本次状态变更时间的结果失效
        stale = [r for r in self.result_repo.list_by_device(device_id, only_valid=True)
                 if r["recorded_at"] < changed_at]
        if stale:
            self.result_repo.invalidate([r["id"] for r in stale], _INVALID_REASON)
            audit_service.log(
                actor=actor["name"], actor_id=actor["id"],
                action="FireDevice.invalidate_stale_results",
                target_type="FireDevice", target_id=device_id,
                template="FireDevice.invalidate_stale_results",
                device_id=device_id, count=len(stale),
            )
            # 台账与总览共用的复核结果
            review_item_service.open_conflict(
                kind="DEVICE_HISTORY",
                conflict_type="STALE_AFTER_DEVICE_STATUS",
                ref_type="fireDevice",
                ref_id=device_id,
                server_snapshot={"status": status, "changed_at": changed_at, "version": old["row_version"]},
                client_payload={"invalidated_result_ids": [r["id"] for r in stale], "note": note},
                building_id=device["building_id"],
                device_id=device_id,
            )

        # 达标率重算
        compliance_service.recompute_building(device["building_id"], actor=actor)
        return updated


fire_device_service = FireDeviceService()
