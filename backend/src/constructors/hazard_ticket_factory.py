from src.constants.rectify_status import RectifyStatus


def create_hazard_ticket_dto(**overrides):
    row = {
        "id": 0,
        "result_id": 1,
        "severity": "MEDIUM",
        "owner_id": 3,
        "deadline": "",
        "rectify_status": RectifyStatus.OPEN,
        "rectify_note": "",
        "closed_at": None,
    }
    row.update(overrides)
    return row
