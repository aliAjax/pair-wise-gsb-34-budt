class ReviewKind:
    """复核结果来源动作。设备台账与合规总览共用同一份复核结果。"""
    SYNC_CONFLICT = "SYNC_CONFLICT"      # 离线同步产生的冲突项
    DEVICE_HISTORY = "DEVICE_HISTORY"    # 设备状态更新导致旧巡检结果失效
    RATE_RECOMPUTE = "RATE_RECOMPUTE"    # 楼栋达标率重算


class ReviewResolution:
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"          # 维持服务端现场数据
    OVERRIDDEN = "OVERRIDDEN"        # 采用巡检员/主管的人工裁决

    ALL = (PENDING, CONFIRMED, OVERRIDDEN)
