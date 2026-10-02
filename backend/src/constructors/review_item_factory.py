"""复核项 DTO 构造器：设备台账与合规总览共用此结构。"""
from src.constants.review_kind import ReviewResolution


def create_review_item_dto(**overrides):
    row = {
        "id": 0,
        "kind": "SYNC_CONFLICT",
        "ref_type": "inspectionResult",
        "ref_id": 0,
        "conflict_type": "",
        "building_id": None,
        "device_id": None,
        "task_id": None,
        "client_uuid": None,
        "batch_id": None,
        "server_snapshot": None,
        "client_payload": None,
        "resolution": ReviewResolution.PENDING,
        "reviewer_id": None,
        "reviewed_at": None,
        "review_note": None,
        "created_at": "",
    }
    row.update(overrides)
    return row
