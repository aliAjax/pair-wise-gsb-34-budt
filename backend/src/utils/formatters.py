"""混合格式化：审计目标、达标率、状态文案。controller/service 多处共用。"""
from src.constants.device_status import DeviceStatus
from src.constants.rectify_status import RectifyStatus
from src.constants.result_status import ResultStatus
from src.constants.hazard_severity import HazardSeverity

DEVICE_STATUS_TEXT = {
    "NORMAL": "正常",
    "FAULT": "故障",
    "RECTIFYING": "整改中",
    "SCRAPPED": "报废",
}
RECTIFY_STATUS_TEXT = {
    RectifyStatus.OPEN: "待整改",
    RectifyStatus.REPAIRING: "整改中",
    RectifyStatus.RECHECKING: "待复验",
    RectifyStatus.CLOSED: "已关闭",
}
RESULT_STATUS_TEXT = {
    ResultStatus.QUALIFIED: "合格",
    ResultStatus.ABNORMAL: "异常",
    ResultStatus.NOT_DONE: "未检",
}
SEVERITY_TEXT = {
    HazardSeverity[0]: "低",
    HazardSeverity[1]: "中",
    HazardSeverity[2]: "高",
    HazardSeverity[3]: "严重",
}


def audit_target(kind, id):
    return f"{kind}#{id}"


def format_percent(value: float) -> str:
    return f"{value * 100:.1f}%"


def format_device_status(value: str) -> str:
    return DEVICE_STATUS_TEXT.get(value, value)


def format_rectify_status(value: str) -> str:
    return RECTIFY_STATUS_TEXT.get(value, value)


def format_result_status(value: str) -> str:
    return RESULT_STATUS_TEXT.get(value, value)


def format_severity(value: str) -> str:
    return SEVERITY_TEXT.get(value, value)
