"""Offline inspection result sync.

需求对应：
- 断网继续填写，恢复网络后把本机结果合并回设备台账；
- 主管已更新设备状态 / 旧巡检结果已失效 → 冲突，只保留冲突项等复核；
- 隐患整改单已关闭时绝不拿旧异常记录覆盖现场 → HAZARD_CLOSED 冲突；
- 同步失败（单条）不影响其它条目，已合并部分保留，可整批重试；
- 代巡检员补录（非本人任务）一律拒绝。
"""

import uuid

from src.constructors.sync_factory import (
    create_hazard_ticket_row,
    create_inspection_result_row,
    create_review_row,
    create_sync_batch_row,
    create_sync_item_row,
)
from src.constants.sync_status import DeviceStatus
from src.repositories import store
from src.repositories.audit_log_repository import audit_log_repository
from src.repositories.fire_device_repository import FireDeviceRepository
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.repositories.inspection_task_repository import InspectionTaskRepository
from src.repositories.review_item_repository import review_item_repository
from src.repositories.sync_batch_repository import sync_batch_repository
from src.utils.errors import BusinessError

_FAULT = DeviceStatus[1]  # FAULT


class SyncService:
    def __init__(self):
        self.task_repo = InspectionTaskRepository()
        self.device_repo = FireDeviceRepository()
        self.result_repo = InspectionResultRepository()
        self.hazard_repo = HazardTicketRepository()

    # ---- public API -----------------------------------------------------

    def submit_batch(self, payload: dict, actor: dict) -> dict:
        items = payload.get("items") or []
        if not items:
            raise BusinessError("VALIDATION_FAILED", 400)

        batch_id = payload.get("batch_id") or f"batch-{uuid.uuid4().hex[:12]}"
        existing = sync_batch_repository.find_by_id(batch_id)
        if existing and existing["status"] in ("MERGED", "CONFLICT"):
            # Finished batches are never re-submitted wholesale; use retry.
            raise BusinessError("SYNC_BATCH_FINISHED", 409, batch_id=batch_id)

        batch = existing
        if batch is None:
            batch = sync_batch_repository.create(
                create_sync_batch_row(batch_id, payload.get("client_meta", {}), len(items), actor))
            batch["_touched"] = set()

        for item in items:
            self._process_item(batch, item, actor)

        self._finalize_batch(batch, actor)
        view = self._batch_view(batch)
        # 整批均为代巡检补录 → 直接 403，便于前端阻断提示。
        if view["total"] > 0 and view["rejected"] == view["total"] and view["merged"] == 0:
            raise BusinessError("PROXY_FORBIDDEN", 403, actor_role=actor["role"])
        return view

    def retry_batch(self, batch_id: str, actor: dict, fixes: dict | None = None) -> dict:
        batch = sync_batch_repository.find_by_id(batch_id)
        if batch is None:
            raise BusinessError("SYNC_BATCH_NOT_FOUND", 404, batch_id=batch_id)

        fix_map = {f["client_result_id"]: f for f in (fixes or {}).get("items", [])}

        # FAILED items are reprocessed; MERGED items stay merged (partial progress kept);
        # CONFLICT items stay pending-review and are never auto-overwritten on retry.
        reprocessed = 0
        for item_row in batch["items"]:
            if item_row["status"] != "FAILED":
                continue
            fresh = fix_map.get(item_row["client_result_id"], self._rebuild_item_payload(item_row))
            self._process_item(batch, fresh, actor, retry=True)
            reprocessed += 1

        self._finalize_batch(batch, actor, is_retry=True, reprocessed=reprocessed)
        audit_log_repository.add(
            "SyncBatch", "SyncBatch.retry", actor,
            batch_id=batch_id, merged=reprocessed)
        return self._batch_view(batch)

    def list_batches(self) -> list:
        return [self._batch_view(b) for b in sync_batch_repository.find_all()]

    def get_batch(self, batch_id: str) -> dict:
        batch = sync_batch_repository.find_by_id(batch_id)
        if batch is None:
            raise BusinessError("SYNC_BATCH_NOT_FOUND", 404, batch_id=batch_id)
        return self._batch_view(batch)

    # ---- per-item pipeline ---------------------------------------------

    def _process_item(self, batch: dict, item: dict, actor: dict, retry: bool = False) -> None:
        item_row = sync_batch_repository.upsert_item(batch, create_sync_item_row(item))
        try:
            task = self.task_repo.find_by_id(item["task_id"])
            device = self.device_repo.find_by_id(item["device_id"])
            if task is None:
                raise BusinessError("TASK_NOT_FOUND", 404, task_id=item["task_id"])
            if device is None:
                raise BusinessError("DEVICE_NOT_FOUND", 404, device_id=item["device_id"])

            # 代巡检员补录：只有任务本人巡检员可以提交（主管也不能代提）。
            if actor["role"] != "INSPECTOR" or task["inspector_id"] != actor["id"]:
                raise BusinessError("PROXY_FORBIDDEN", 403, actor_role=actor["role"])

            # 同一批次内更早合并的条目已经改过设备，以内存最新版本为准，避免误报冲突。
            touched_in_batch = device["id"] in batch.setdefault("_touched", set())

            # 冲突1：主管已在台账更新设备状态（设备故障/维保/报废，乐观版本号不匹配）。
            version_changed = item.get("base_device_version") and \
                item["base_device_version"] != device.get("version", 1)
            if not touched_in_batch and version_changed and device["status"] != DeviceStatus[0]:
                self._raise_conflict(batch, item_row, item, device, actor, "DEVICE_STATUS_CHANGED")
                return

            latest = self.result_repo.latest_effective_by_device(device["id"])

            # 冲突2：服务端已有更新的有效结果（旧结果已失效/被新巡检覆盖）。
            if latest and latest["captured_at"] > item.get("captured_at", ""):
                self._raise_conflict(batch, item_row, item, {
                    **device, "building_id": device["building_id"],
                    "server_result": latest,
                }, actor, "RESULT_SUPERSEDED")
                return

            # 冲突3：该设备异常结果对应的隐患整改单已复验关闭，
            # 旧的异常记录不能覆盖现场（无论旧结果是否已被置为失效）。
            if item["result_status"] == "ABNORMAL":
                closed_ticket = self._closed_ticket_for_device(device["id"])
                if closed_ticket is not None and item.get("captured_at", "") <= closed_ticket["closed_at"]:
                    self._raise_conflict(batch, item_row, item, {
                        **device, "building_id": device["building_id"],
                        "server_result": latest, "closed_ticket": closed_ticket,
                    }, actor, "HAZARD_CLOSED")
                    return

            self._merge_item(batch, item_row, item, task, device, actor)
        except BusinessError as exc:
            if item_row["status"] == "CONFLICT":
                return  # conflict already recorded
            item_row["status"] = "REJECTED" if exc.code == "PROXY_FORBIDDEN" else "FAILED"
            item_row["reason"] = exc.code
            if not retry:
                audit_log_repository.add(
                    "InspectionResult", "InspectionResult.update", actor,
                    entity_id=0, device_id=item.get("device_id"), fields=exc.message)

    def _merge_item(self, batch, item_row, item, task, device, actor) -> None:
        batch.setdefault("_touched", set()).add(device["id"])
        # 旧有效结果失效，新结果成为最新现场。
        self.result_repo.supersede_for_device(device["id"])
        result = self.result_repo.create(create_inspection_result_row(item, task["id"]))

        if item["result_status"] == "ABNORMAL":
            self.device_repo.update_status(device, _FAULT)
            ticket = self.hazard_repo.create(create_hazard_ticket_row(
                result["id"], device["id"], item, owner_id=actor["id"]))
            self.result_repo.bind_hazard_ticket(result, ticket["id"])
            audit_log_repository.add(
                "HazardTicket", "HazardTicket.create", actor,
                entity_id=ticket["id"], result_id=result["id"], severity=ticket["severity"])
            audit_log_repository.add(
                "FireDevice", "FireDevice.status", actor,
                entity_id=device["id"], device_code=device["device_code"],
                old_status="NORMAL", status=_FAULT)
        else:
            # 现场恢复正常：FAULT 设备回到 NORMAL（主管另有显式改状态入口）。
            if device["status"] != DeviceStatus[0]:
                self.device_repo.update_status(device, DeviceStatus[0])

        self.task_repo.update_fields(task, status="SUBMITTED", finished_at=result["captured_at"])
        item_row["status"] = "MERGED"
        item_row["server_result_id"] = result["id"]
        item_row["reason"] = ""
        audit_log_repository.add(
            "InspectionResult", "InspectionResult.create", actor,
            entity_id=result["id"], device_id=device["id"],
            result_status=item["result_status"])

    def _raise_conflict(self, batch, item_row, item, device_snapshot, actor, reason) -> None:
        review = review_item_repository.create(
            create_review_row(batch["id"], item, reason, device_snapshot, actor))
        item_row["status"] = "CONFLICT"
        item_row["review_id"] = review["id"]
        item_row["reason"] = reason
        audit_log_repository.add(
            "SyncBatch", "SyncBatch.conflict", actor,
            batch_id=batch["id"], review_id=review["id"], reason=reason)

    def _closed_ticket_for_device(self, device_id: int):
        closed = [t for t in self.hazard_repo.find_all()
                  if t["device_id"] == device_id and t["rectify_status"] == "CLOSED"]
        return closed[-1] if closed else None

    # ---- helpers --------------------------------------------------------

    def _rebuild_item_payload(self, item_row: dict) -> dict:
        return {
            "client_result_id": item_row["client_result_id"],
            "task_id": item_row["task_id"],
            "device_id": item_row["device_id"],
            "item_code": item_row["item_code"],
            "result_status": item_row.get("result_status", "NORMAL"),
            "measured_value": item_row.get("measured_value", ""),
            "photo_url": item_row.get("photo_url", ""),
            "note": item_row.get("note", ""),
            "captured_at": item_row.get("captured_at", ""),
            "base_device_version": item_row.get("base_device_version", 1),
        }

    def _finalize_batch(self, batch: dict, actor: dict, is_retry=False, reprocessed=0) -> None:
        items = batch["items"]
        batch["merged"] = sum(1 for i in items if i["status"] == "MERGED")
        batch["conflict"] = sum(1 for i in items if i["status"] == "CONFLICT")
        batch["rejected"] = sum(1 for i in items if i["status"] == "REJECTED")
        batch["failed"] = sum(1 for i in items if i["status"] == "FAILED")
        if batch["failed"]:
            batch["status"] = "FAILED" if batch["merged"] == 0 else "CONFLICT"
        elif batch["conflict"] or batch["rejected"]:
            batch["status"] = "CONFLICT"
        else:
            batch["status"] = "MERGED"
        batch["updated_at"] = store.now_iso()
        if not is_retry:
            audit_log_repository.add(
                "SyncBatch", "SyncBatch.merge", actor,
                batch_id=batch["id"], merged=batch["merged"], conflict=batch["conflict"])

    def _batch_view(self, batch: dict) -> dict:
        return {
            "id": batch["id"],
            "status": batch["status"],
            "total": batch["total"],
            "merged": batch["merged"],
            "conflict": batch["conflict"],
            "rejected": batch["rejected"],
            "failed": batch["failed"],
            "submitted_by_name": batch.get("submitted_by_name"),
            "created_at": batch.get("created_at"),
            "updated_at": batch.get("updated_at"),
            "items": batch["items"],
        }


sync_service = SyncService()
