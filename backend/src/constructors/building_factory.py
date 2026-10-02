def create_building_dto(**overrides):
    row = {
        "id": 0,
        "name": "",
        "campus": "",
        "floor_count": 1,
        "fire_grade": "一级",
        "manager_id": 4,
        "address_code": "",
    }
    row.update(overrides)
    return row


def create_building_overview_dto(building, compliance_rate: float, device_total: int,
                                 qualified_devices: int, pending_reviews: int):
    """合规总览/报表共用的楼栋聚合响应对象。"""
    row = dict(building)
    row.update({
        "compliance_rate": compliance_rate,
        "device_total": device_total,
        "qualified_devices": qualified_devices,
        "pending_reviews": pending_reviews,
    })
    return row
