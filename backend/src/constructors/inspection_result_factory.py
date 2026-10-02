from src.constants.result_status import ResultStatus


def create_inspection_result_dto(**overrides):
    row = {
        "id": 0,
        "task_id": 1,
        "device_id": 1,
        "item_code": "",
        "result_status": ResultStatus.NOT_DONE,
        "measured_value": "",
        "photo_url": "",
        "note": "",
        "recorded_at": "",
        "source": "OFFLINE",
        "valid": True,
        "invalid_reason": None,
        "client_uuid": None,
    }
    row.update(overrides)
    return row
