from src.services.inspection_result_service import inspection_result_service


def list_inspection_result(task_id: int | None = None, device_id: int | None = None):
    return inspection_result_service.list(task_id=task_id, device_id=device_id)


def sync_inspection_results(payload, actor: dict):
    """断网恢复后的批量合并入口（支持失败重试、幂等、冲突转复核）。"""
    return inspection_result_service.sync_batch(payload, actor)
