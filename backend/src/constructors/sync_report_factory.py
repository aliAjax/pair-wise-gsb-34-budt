"""离线同步批响应构造器：已合并 / 已幂等跳过 / 冲突转复核 / 失败待重试。"""


def create_sync_report_dto(batch_id: str, merged=None, skipped=None, conflicts=None,
                           failed=None, task_submitted=None):
    return {
        "batch_id": batch_id,
        "merged": merged or [],
        "skipped": skipped or [],
        "conflicts": conflicts or [],
        "failed": failed or [],
        "task_submitted": task_submitted,
        "merged_count": len(merged or []),
        "conflict_count": len(conflicts or []),
        "has_more": bool(failed),
    }
