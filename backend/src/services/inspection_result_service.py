"""巡检结果服务：离线结果合并、冲突识别、复核裁决回写。

合并规则（与需求逐条对应）：
1. 巡检员地下室断网可继续填，网络恢复后整批合并；按 client_uuid 幂等，
   同步失败重试时已合并部分保留，不重复写入。
2. 设备在本机记录之后被物业主管更新过状态 -> DEVICE_STATUS_CHANGED 冲突，转复核。
3. 结果关联的隐患整改单已关闭 -> TICKET_CLOSED 冲突，绝不拿旧记录覆盖现场，
   只保留冲突项等复核。
4. 服务端已有更新的同项结果 -> SERVER_NEWER 冲突（乐观版本）。
5. 代巡检员补录：任务不属于本人时整批拒绝（PROXY_FILL_DENIED）。
"""
from datetime import datetime, timezone
from typing import List

from src.constants.result_status import ResultStatus
from src.constants.inspection_status import InspectionStatus
from src.constants.rectify_status import RectifyStatus
from src.constructors.inspection_result_factory import create_inspection_result_dto
from src.constructors.sync_report_factory import create_sync_report_dto
from src.db import db
from src.constants.exceptions import AppError, NotFoundError, ValidationError
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.repositories.inspection_task_repository import InspectionTaskRepository
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.services.audit_service import audit_service
from src.services.compliance_service import compliance_service
from src.services.review_item_service import review_item_service

CONFLICT_DEVICE = "DEVICE_STATUS_CHANGED"
CONFLICT_TICKET = "TICKET_CLOSED"
CONFLICT_SERVER_NEWER = "SERVER_NEWER"


class InspectionResultService:
    def __init__(self):
        self.repo = InspectionResultRepository()
        self.task_repo = InspectionTaskRepository()
        self.device_repo = FireDeviceRepository()
        self.ticket_repo = HazardTicketRepository()

    def list(self, task_id: int | None = None, device_id: int | None = None):
        rows = self.repo.find_all()
        if task_id is not None:
            rows = [r for r in rows if r["task_id"] == task_id]
        if device_id is not None:
            rows = [r for r in rows if r["device_id"] == device_id]
        return rows

    # ------------------------------------------------------------------
    # 离线合并
    # ------------------------------------------------------------------
    def sync_batch(self, payload, actor: dict) -> dict:
        items = payload.items
        if not items:
            raise ValidationError("同步批次不能为空")

        # 规则 5：本批任意一条任务不属于本人 -> 整批拒绝（代补录），不落任何数据
        task_cache = {}
        for item in items:
            task = task_cache.get(item.task_id) or self.task_repo.get(item.task_id)
            task_cache[item.task_id] = task
            if task is None:
                raise NotFoundError("巡检任务")
            if task["inspector_id"] != actor["id"]:
                audit_service.log(
                    actor=actor["name"], actor_id=actor["id"],
                    action="InspectionResult.proxy_fill_rejected",
                    target_type="InspectionTask", target_id=item.task_id,
                    template="InspectionResult.proxy_fill_rejected",
                    actor_name=actor["name"], task_id=item.task_id,
                )
                raise AppError("PROXY_FILL_DENIED", status_code=403)

        batch = db.sync_batches.setdefault(
            payload.batch_id, {"merged": [], "conflict": [], "done": False}
        )

        merged, skipped, conflicts, failed = [], [], [], []
        affected_buildings: set[int] = set()

        for item in items:
            try:
                outcome = self._merge_one(item, actor, payload.batch_id, payload.source,
                                          merged_uuids=batch["merged"],
                                          conflict_uuids=batch["conflict"])
            except Exception as exc:  # 单条异常不回滚已合并部分，留给重试
                failed.append({"client_uuid": item.client_uuid,
                               "code": getattr(exc, "code", "INTERNAL_ERROR"),
                               "message": str(exc)})
                continue

            if outcome["status"] == "merged":
                merged.append(item.client_uuid)
                batch["merged"].append(item.client_uuid)
                device = self.device_repo.get(item.device_id)
                if device:
                    affected_buildings.add(device["building_id"])
            elif outcome["status"] == "skipped":
                skipped.append(item.client_uuid)
            else:
                conflicts.append({"client_uuid": item.client_uuid,
                                  "conflict_type": outcome["conflict_type"],
                                  "review_id": outcome["review_id"]})
                if item.client_uuid not in batch["conflict"]:
                    batch["conflict"].append(item.client_uuid)

        task_submitted = None
        if payload.submit_task and not failed:
            task_ids = {i.task_id for i in items}
            for task_id in task_ids:
                task = self.task_repo.get(task_id)
                if task["status"] in (InspectionStatus[0], InspectionStatus[1]):
                    self.task_repo.update(
                        task_id, status=InspectionStatus[2],
                        finished_at=_now(),
                    )
                    audit_service.log(
                        actor=actor["name"], actor_id=actor["id"],
                        action="InspectionTask.submit", target_type="InspectionTask",
                        target_id=task_id, template="InspectionTask.submit",
                        actor_name=actor["name"], task_id=task_id, source=payload.source,
                    )
                    task_submitted = task_id

        for building_id in affected_buildings:
            compliance_service.recompute_building(building_id, actor=actor)

        report = create_sync_report_dto(
            payload.batch_id, merged=merged, skipped=skipped, conflicts=conflicts,
            failed=failed, task_submitted=task_submitted,
        )
        audit_service.log(
            actor=actor["name"], actor_id=actor["id"],
            action="InspectionResult.offline_merge", target_type="SyncBatch",
            target_id=payload.batch_id, template="InspectionResult.offline_merge",
            merged=len(merged), conflict=len(conflicts), batch_id=payload.batch_id,
        )
        return report

    def _merge_one(self, item, actor, batch_id: str, source: str,
                   merged_uuids: List[str], conflict_uuids: List[str]) -> dict:
        task = self.task_repo.get(item.task_id)
        device = self.device_repo.get(item.device_id)
        if device is None:
            raise NotFoundError("设备")
        if item.result_status not in ResultStatus.ALL:
            raise ValidationError(f"非法巡检结果状态：{item.result_status}")

        # 幂等：重试时已合并的直接跳过，已冲突的直接返回原冲突
        if item.client_uuid in merged_uuids:
            return {"status": "skipped"}
        existing_conflict = self._find_conflict_by_uuid(item.client_uuid)
        if item.client_uuid in conflict_uuids and existing_conflict:
            return {"status": "conflict",
                    "conflict_type": existing_conflict["conflict_type"],
                    "review_id": existing_conflict["id"]}

        client_payload = item.model_dump()

        # 规则 3：关联隐患单已关闭 -> 不覆盖现场，仅保留冲突项
        closed_ticket = next(
            (t for t in self.ticket_repo.find_all()
             if t["result_id"] in self._result_ids_for(item) and t["rectify_status"] == RectifyStatus.CLOSED),
            None,
        )
        if closed_ticket is not None:
            return self._raise_conflict(
                item, client_payload, CONFLICT_TICKET,
                server_snapshot={"ticket_id": closed_ticket["id"],
                                 "rectify_status": RectifyStatus.CLOSED,
                                 "closed_at": closed_ticket["closed_at"],
                                 "rectify_note": closed_ticket["rectify_note"]},
                batch_id=batch_id, device=device, task=task,
                ticket=closed_ticket,
            )

        # 规则 2：设备在本机记录之后被主管更新过 -> 冲突
        if device["status_changed_at"] and device["status_changed_at"] > item.recorded_at:
            return self._raise_conflict(
                item, client_payload, CONFLICT_DEVICE,
                server_snapshot={"device_status": device["status"],
                                 "status_changed_at": device["status_changed_at"],
                                 "row_version": device["row_version"]},
                batch_id=batch_id, device=device, task=task,
            )

        # 规则 4：同设备同检查项已有更新的服务端结果
        same_item = [r for r in self.repo.list_by_device(item.device_id, only_valid=True)
                     if r["item_code"] == item.item_code]
        if same_item:
            latest_server = max(same_item, key=lambda r: r["recorded_at"])
            if latest_server["recorded_at"] > item.recorded_at:
                return self._raise_conflict(
                    item, client_payload, CONFLICT_SERVER_NEWER,
                    server_snapshot={"result_id": latest_server["id"],
                                     "recorded_at": latest_server["recorded_at"],
                                     "result_status": latest_server["result_status"]},
                    batch_id=batch_id, device=device, task=task,
                )

        # 正常合并（upsert：同 client_uuid 理论上已在前面幂等拦截）
        row = create_inspection_result_dto(
            id=db.next_id("inspectionResult"),
            task_id=item.task_id, device_id=item.device_id,
            item_code=item.item_code, result_status=item.result_status,
            measured_value=item.measured_value, photo_url=item.photo_url,
            note=item.note, recorded_at=item.recorded_at, source=source,
            client_uuid=item.client_uuid,
        )
        self.repo.add(row)
        return {"status": "merged"}

    # ------------------------------------------------------------------
    # 复核裁决回写
    # ------------------------------------------------------------------
    def apply_reviewed_client_payload(self, review: dict, reviewer: dict, note: str) -> dict:
        payload = review["client_payload"]
        row = create_inspection_result_dto(
            id=db.next_id("inspectionResult"),
            task_id=payload["task_id"], device_id=payload["device_id"],
            item_code=payload["item_code"], result_status=payload["result_status"],
            measured_value=payload.get("measured_value", ""),
            photo_url=payload.get("photo_url", ""),
            note=payload.get("note", ""),
            recorded_at=_now(), source="REVIEW_OVERRIDE",
            client_uuid=payload.get("client_uuid"),
        )
        self.repo.add(row)
        device = self.device_repo.get(payload["device_id"])
        if device:
            compliance_service.recompute_building(device["building_id"], actor=reviewer)
        return row

    def restore_result_from_review(self, review: dict, reviewer: dict, note: str):
        ids = review["client_payload"]["invalidated_result_ids"]
        for result_id in ids:
            row = self.repo.get(result_id)
            if row:
                row["valid"] = True
                row["invalid_reason"] = None
        device = self.device_repo.get(review["device_id"])
        if device:
            compliance_service.recompute_building(device["building_id"], actor=reviewer)

    # ------------------------------------------------------------------ helpers
    def _result_ids_for(self, item) -> List[int]:
        return [r["id"] for r in self.repo.list_by_device(item.device_id)
                if r["item_code"] == item.item_code]

    def _find_conflict_by_uuid(self, client_uuid: str):
        return next((r for r in review_item_service.repo.find_all()
                     if r.get("client_uuid") == client_uuid), None)

    def _raise_conflict(self, item, client_payload, conflict_type, *, server_snapshot,
                        batch_id, device, task, ticket=None) -> dict:
        ref_id = ticket["id"] if conflict_type == CONFLICT_TICKET and ticket else item.device_id
        ref_type = "hazardTicket" if conflict_type == CONFLICT_TICKET else "fireDevice"
        review = review_item_service.open_conflict(
            kind="SYNC_CONFLICT", conflict_type=conflict_type, ref_type=ref_type,
            ref_id=ref_id, server_snapshot=server_snapshot,
            client_payload=client_payload, building_id=device["building_id"],
            device_id=item.device_id,
            task_id=task["id"], client_uuid=item.client_uuid, batch_id=batch_id,
        )
        if conflict_type == CONFLICT_TICKET and ticket:
            audit_service.log(
                actor="system", actor_id=None,
                action="HazardTicket.closed_overwrite_blocked",
                target_type="HazardTicket", target_id=ticket["id"],
                template="HazardTicket.closed_overwrite_blocked",
                ticket_id=ticket["id"], result_id=server_snapshot.get("result_id", client_payload["item_code"]),
            )
        return {"status": "conflict", "conflict_type": conflict_type, "review_id": review["id"]}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


inspection_result_service = InspectionResultService()
