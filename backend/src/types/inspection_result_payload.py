from pydantic import BaseModel, Field


class ResultItemIn(BaseModel):
    """离线/在线单条检查结果。client_uuid 由本机生成，用于重试幂等。"""
    client_uuid: str = Field(min_length=1)
    task_id: int
    device_id: int
    item_code: str
    result_status: str
    measured_value: str = ""
    photo_url: str = ""
    note: str = ""
    recorded_at: str
    expected_version: int | None = None


class SyncBatchPayload(BaseModel):
    batch_id: str = Field(min_length=1)
    source: str = "OFFLINE"   # OFFLINE / ONLINE，审计可区分来源
    items: list[ResultItemIn]
    submit_task: bool = False


class ProxyFillNote(BaseModel):
    """代补录场景：代谁提交必须显式声明，且一律拒绝。"""
    on_behalf_of: int | None = None
