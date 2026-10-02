"""Building compliance rate, the single computation source shared by the
device ledger (FireDevice) and the compliance overview (Building dashboard).

判定规则：
- 设备 status != NORMAL（主管已标记 FAULT / MAINTAINING / SCRAPPED）→ 不达标；
- 否则以该设备最新一条 effective 巡检结果为准：NORMAL 达标、ABNORMAL 不达标；
- 尚无有效巡检结果 → 漏检，计为不达标。
主管更新设备状态会使旧结果失效并触发重算，因此前端两处页面永远拿到同一份结论。
"""

from src.constants.sync_status import DeviceStatus
from src.repositories.building_repository import BuildingRepository
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.inspection_result_repository import InspectionResultRepository


class ComplianceService:
    def __init__(self):
        self.building_repo = BuildingRepository()
        self.device_repo = FireDeviceRepository()
        self.result_repo = InspectionResultRepository()

    def evaluate_device(self, device: dict) -> dict:
        if device["status"] != DeviceStatus[0]:
            return {"compliant": False, "reason": "DEVICE_STATUS",
                    "result_id": None, "detail": f"设备状态为 {device['status']}"}
        latest = self.result_repo.latest_effective_by_device(device["id"])
        if latest is None:
            return {"compliant": False, "reason": "MISSED", "result_id": None, "detail": "无有效巡检结果"}
        if latest["result_status"] == "NORMAL":
            return {"compliant": True, "reason": "INSPECTED",
                    "result_id": latest["id"], "detail": "最新巡检合格"}
        return {"compliant": False, "reason": "INSPECTED",
                "result_id": latest["id"], "detail": "最新巡检异常"}

    def building_rate(self, building_id: int) -> dict:
        devices = self.device_repo.list_by_building(building_id)
        evaluations = [self.evaluate_device(d) for d in devices]
        total = len(devices)
        compliant = sum(1 for e in evaluations if e["compliant"])
        missed = sum(1 for e in evaluations if e["reason"] == "MISSED")
        abnormal = sum(1 for e in evaluations if not e["compliant"] and e["reason"] != "MISSED")
        rate = round(compliant / total * 100, 1) if total else 0.0
        return {
            "building_id": building_id,
            "total_devices": total,
            "compliant_devices": compliant,
            "abnormal_devices": abnormal,
            "missed_devices": missed,
            "compliance_rate": rate,
        }

    def overview(self) -> list[dict]:
        rows = []
        for building in self.building_repo.find_all():
            rate = self.building_rate(building["id"])
            rate["building_name"] = building["name"]
            rate["campus"] = building["campus"]
            rate["fire_grade"] = building["fire_grade"]
            rows.append(rate)
        return rows

    def device_compliance_map(self) -> dict:
        return {d["id"]: self.evaluate_device(d) for d in self.device_repo.find_all()}


compliance_service = ComplianceService()
