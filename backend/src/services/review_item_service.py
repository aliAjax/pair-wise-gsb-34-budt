"""复核项领域服务。

设备台账（旧巡检失效）与合规总览（同步冲突）共用同一份复核结果，
因此两个入口都只能调用本服务，不允许各自维护冲突列表。
"""
from datetime import datetime, timezone

from src.constants.review_kind import ReviewResolution
from src.constructors.review_item_factory import create_review_item_dto
from src.db import db
from src.repositories.review_item_repository import ReviewItemRepository
from src.services.audit_service import audit_service


class ReviewItemService:
    def __init__(self):
        self.repo = ReviewItemRepository()

    def list(self, pending_only: bool = False, building_id: int | None = None):
        rows = self.repo.list_pending() if pending_only else self.repo.find_all()
        if building_id is not None:
            rows = [r for r in rows if r["building_id"] == building_id]
        return rows

    def open_conflict(self, *, kind: str, conflict_type: str, ref_type: str, ref_id: int,
                      server_snapshot: dict | None, client_payload: dict,
                      building_id: int | None = None, device_id: int | None = None,
                      task_id: int | None = None, client_uuid: str | None = None,
                      batch_id: str | None = None) -> dict:
        # 同一业务键只保留一个待复核项，避免重试刷出重复冲突
        existed = self.repo.find_open(kind, ref_type, ref_id)
        if existed is not None:
            return existed
        row = create_review_item_dto(
            id=db.next_id("reviewItem"),
            kind=kind,
            conflict_type=conflict_type,
            ref_type=ref_type,
            ref_id=ref_id,
            server_snapshot=server_snapshot,
            client_payload=client_payload,
            building_id=building_id,
            device_id=device_id,
            task_id=task_id,
            client_uuid=client_uuid,
            batch_id=batch_id,
            created_at=_now(),
        )
        saved = self.repo.add(row)
        audit_service.log(
            actor="system", actor_id=None, action="ReviewItem.create",
            target_type="ReviewItem", target_id=saved["id"],
            template="ReviewItem.create", kind=kind, target=f"{ref_type}#{ref_id}",
        )
        return saved

    def resolve(self, review_id: int, resolution: str, reviewer: dict, note: str) -> dict:
        row = self.repo.get(review_id)
        if row is None:
            from src.constants.exceptions import NotFoundError

            raise NotFoundError("复核项")
        if row["resolution"] != ReviewResolution.PENDING:
            from src.constants.exceptions import ValidationError

            raise ValidationError("该复核项已裁决，不能重复处理")
        self.repo.resolve(review_id, resolution, reviewer["id"], _now(), note)
        audit_service.log(
            actor=reviewer["name"], actor_id=reviewer["id"],
            action="ReviewItem.resolve", target_type="ReviewItem", target_id=review_id,
            template="ReviewItem.resolve", review_id=review_id,
            actor_name=reviewer["name"],
            resolution=resolution,
        )
        return self._apply_resolution(row, resolution, reviewer, note)

    def _apply_resolution(self, row: dict, resolution: str, reviewer: dict, note: str) -> dict:
        """裁决生效：OVERRIDDEN 时把客户端数据补写回业务表；CONFIRMED 维持现场。"""
        if resolution != ReviewResolution.OVERRIDDEN:
            return row
        from src.services.inspection_result_service import inspection_result_service

        if row["kind"] == "SYNC_CONFLICT":
            inspection_result_service.apply_reviewed_client_payload(row, reviewer, note)
        elif row["kind"] == "DEVICE_HISTORY":
            inspection_result_service.restore_result_from_review(row, reviewer, note)
        return row


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


review_item_service = ReviewItemService()
