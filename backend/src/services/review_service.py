"""Conflict review.

复核项是设备台账和合规总览共用的唯一复核结果来源：
- 两个页面都通过 ReviewItemRepository 读取同一份 pending/resolved 数据；
- KEEP_SERVER：不覆盖现场，仅把该冲突标记解决（保持主管/现场状态）；
- TAKE_CLIENT：采用巡检员离线记录，落地为新结果（隐患已关闭的场景会开新单，
  绝不重开/覆盖已关闭整改单），随后旧有效结果失效并触发达标率重算。
"""

from src.constructors.sync_factory import (
    create_hazard_ticket_row,
    create_inspection_result_row,
)
from src.constants.sync_status import DeviceStatus
from src.repositories.audit_log_repository import audit_log_repository
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.repositories.inspection_task_repository import InspectionTaskRepository
from src.repositories.review_item_repository import review_item_repository
from src.repositories.sync_batch_repository import sync_batch_repository
from src.utils.errors import BusinessError

_DECISIONS = {"KEEP_SERVER", "TAKE_CLIENT"}


class ReviewService:
    def __init__(self):
        self.device_repo = FireDeviceRepository()
        self.result_repo = InspectionResultRepository()
        self.task_repo = InspectionTaskRepository()
        self.hazard_repo = HazardTicketRepository()

    def list_items(self, building_id: int | None = None, status: str | None = None):
        rows = review_item_repository.find_all(building_id)
        if status:
            rows = [r for r in rows if r["status"] == status]
        return rows

    def resolve(self, review_id: int, decision: str, actor: dict) -> dict:
        if decision not in _DECISIONS:
            raise BusinessError("REVIEW_DECISION_INVALID", 400)
        review = review_item_repository.find_by_id(review_id)
        if review is None:
            raise BusinessError("REVIEW_NOT_FOUND", 404, review_id=review_id)
        if review["status"] != "PENDING":
            raise BusinessError("REVIEW_ALREADY_RESOLVED", 409, review_id=review_id)

        server_result_id = None
        if decision == "TAKE_CLIENT":
            server_result_id = self._apply_client_record(review, actor)

        review_item_repository.resolve(
            review, decision,
            {"id": actor["id"], "name": actor["name"], "role": actor["role"]},
            result_id=server_result_id)
        self._refresh_batch_counters(review["batch_id"])

        audit_log_repository.add(
            "ReviewItem", f"ReviewItem.{decision.lower()}", actor, review_id=review_id)
        audit_log_repository.add(
            "ReviewItem", "ReviewItem.resolve", actor, review_id=review_id, decision=decision)
        return review

    def _apply_client_record(self, review: dict, actor: dict) -> int:
        device = self.device_repo.find_by_id(review["device_id"])
        task = self.task_repo.find_by_id(review["task_id"])
        item = {
            "device_id": review["device_id"],
            "item_code": review["item_code"],
            "result_status": review["result_status"],
            "measured_value": review["measured_value"],
            "photo_url": review["photo_url"],
            "note": review["note"],
            "captured_at": review["captured_at"],
            "severity": "HIGH",
        }
        self.result_repo.supersede_for_device(device["id"])
        result = self.result_repo.create(
            create_inspection_result_row(item, task["id"] if task else review["task_id"]))

        if review["result_status"] == "ABNORMAL":
            self.device_repo.update_status(device, DeviceStatus[1])
            # 原整改单已关闭 → 开一张新单，现场不覆盖旧单。
            ticket = self.hazard_repo.create(
                create_hazard_ticket_row(result["id"], device["id"], item, owner_id=actor["id"]))
            self.result_repo.bind_hazard_ticket(result, ticket["id"])
            audit_log_repository.add(
                "HazardTicket", "HazardTicket.create", actor,
                entity_id=ticket["id"], result_id=result["id"], severity=ticket["severity"])

        if task:
            self.task_repo.update_fields(task, status="SUBMITTED", finished_at=result["captured_at"])
        return result["id"]

    def _refresh_batch_counters(self, batch_id: str) -> None:
        batch = sync_batch_repository.find_by_id(batch_id)
        if not batch:
            return
        for item_row in batch["items"]:
            if item_row["status"] == "CONFLICT":
                review = review_item_repository.find_by_id(item_row["review_id"])
                if review and review["status"] != "PENDING":
                    item_row["status"] = "RESOLVED"
        batch["conflict"] = sum(1 for i in batch["items"] if i["status"] == "CONFLICT")
        batch["merged"] = sum(1 for i in batch["items"] if i["status"] in ("MERGED", "RESOLVED"))
        batch["failed"] = sum(1 for i in batch["items"] if i["status"] == "FAILED")
        batch["rejected"] = sum(1 for i in batch["items"] if i["status"] == "REJECTED")
        if batch["conflict"] == 0:
            batch["status"] = "MERGED" if batch["failed"] == 0 else "FAILED"


review_service = ReviewService()
