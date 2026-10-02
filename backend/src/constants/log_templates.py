"""操作日志模板（写操作必须引用模板，禁止在调用处散写文案）。"""

LOG_TEMPLATES = {
    "Building": [
        "Building.create",
        "Building.update",
        "Building.status",
        "Building.export",
        "Building.recompute_rate",
    ],
    "FireDevice": [
        "FireDevice.create",
        "FireDevice.update",
        "FireDevice.status",
        "FireDevice.export",
        "FireDevice.invalidate_stale_results",
    ],
    "InspectionTask": [
        "InspectionTask.create",
        "InspectionTask.update",
        "InspectionTask.status",
        "InspectionTask.export",
        "InspectionTask.submit",
    ],
    "InspectionResult": [
        "InspectionResult.create",
        "InspectionResult.update",
        "InspectionResult.status",
        "InspectionResult.export",
        "InspectionResult.offline_merge",
        "InspectionResult.proxy_fill_rejected",
    ],
    "HazardTicket": [
        "HazardTicket.create",
        "HazardTicket.update",
        "HazardTicket.status",
        "HazardTicket.export",
        "HazardTicket.closed_overwrite_blocked",
    ],
    "ReviewItem": [
        "ReviewItem.create",
        "ReviewItem.update",
        "ReviewItem.resolve",
        "ReviewItem.export",
    ],
}

LOG_TEXT = {
    "Building.recompute_rate": "楼栋 {building_id} 达标率重算：{old_rate:.1%} -> {new_rate:.1%}",
    "FireDevice.status": "设备 {device_code} 状态由 {old_status} 变更为 {new_status}",
    "FireDevice.invalidate_stale_results": "设备 {device_id} 状态更新，{count} 条旧巡检结果标记失效",
    "InspectionTask.submit": "巡检员 {actor_name} 提交任务 {task_id}（来源：{source}）",
    "InspectionResult.offline_merge": "离线结果合并：{merged} 条写入，{conflict} 条冲突转复核，batch={batch_id}",
    "InspectionResult.proxy_fill_rejected": "拒绝代巡检员 {actor_name} 为任务 {task_id} 补录检查结果",
    "HazardTicket.closed_overwrite_blocked": "隐患单 {ticket_id} 已关闭，旧结果 {result_id} 覆盖被拦截",
    "ReviewItem.create": "复核项 {review_id} 已生成（{kind}，关联 {target}）",
    "ReviewItem.resolve": "复核项 {review_id} 由 {actor_name} 裁决为 {resolution}",
}


def render(template_key: str, **kwargs) -> str:
    template = LOG_TEXT.get(template_key, template_key)
    try:
        return template.format(**kwargs)
    except (KeyError, IndexError, ValueError):
        return template_key
