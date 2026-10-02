from src.repositories import store


def create_inspection_result_row(item: dict, task_id: int) -> dict:
    """Build a persisted InspectionResult row from an offline client item."""
    return {
        "id": None,
        "task_id": task_id,
        "device_id": item["device_id"],
        "item_code": item["item_code"],
        "result_status": item["result_status"],
        "measured_value": item.get("measured_value", ""),
        "photo_url": item.get("photo_url", ""),
        "note": item.get("note", ""),
        "effective": True,
        "version": 1,
        "captured_at": item.get("captured_at") or store.now_iso(),
        "reviewed_at": None,
        "hazard_ticket_id": None,
    }


def create_hazard_ticket_row(result_id: int, device_id: int, item: dict, owner_id: int) -> dict:
    return {
        "id": None,
        "result_id": result_id,
        "device_id": device_id,
        "severity": item.get("severity", "HIGH"),
        "owner_id": owner_id,
        "deadline": item.get("deadline", ""),
        "rectify_status": "OPEN",
        "rectify_note": "",
        "closed_at": "",
        "version": 1,
    }


def create_sync_batch_row(batch_id: str, client_meta: dict, item_count: int, actor: dict) -> dict:
    return {
        "id": batch_id,
        "client_meta": client_meta,
        "submitted_by": actor["id"],
        "submitted_by_name": actor["name"],
        "status": "MERGING",
        "total": item_count,
        "merged": 0,
        "conflict": 0,
        "rejected": 0,
        "failed": 0,
        "created_at": store.now_iso(),
        "updated_at": store.now_iso(),
        "items": [],
    }


def create_sync_item_row(item: dict) -> dict:
    # Full client payload is persisted so FAILED items can be retried later
    # even if the client already discarded its local outbox.
    return {
        "client_result_id": item["client_result_id"],
        "task_id": item["task_id"],
        "device_id": item["device_id"],
        "item_code": item["item_code"],
        "result_status": item["result_status"],
        "measured_value": item.get("measured_value", ""),
        "photo_url": item.get("photo_url", ""),
        "note": item.get("note", ""),
        "captured_at": item.get("captured_at", ""),
        "base_device_version": item.get("base_device_version", 1),
        "status": "PENDING",
        "server_result_id": None,
        "review_id": None,
        "reason": "",
    }


def create_review_row(batch_id: str, item: dict, reason: str, server_snapshot: dict, actor: dict) -> dict:
    return {
        "id": None,
        "batch_id": batch_id,
        "reason": reason,
        "status": "PENDING",
        "task_id": item["task_id"],
        "device_id": item["device_id"],
        "building_id": server_snapshot.get("building_id"),
        "item_code": item["item_code"],
        "result_status": item["result_status"],
        "measured_value": item.get("measured_value", ""),
        "photo_url": item.get("photo_url", ""),
        "note": item.get("note", ""),
        "captured_at": item.get("captured_at", ""),
        "base_device_version": item.get("base_device_version", 1),
        "server_snapshot": server_snapshot,
        "submitted_by": actor["id"],
        "submitted_by_name": actor["name"],
        "resolved_by": None,
        "resolved_at": None,
        "server_result_id": None,
        "created_at": store.now_iso(),
    }
