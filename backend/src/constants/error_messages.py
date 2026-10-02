ERROR_MESSAGES = {
    "AUTH_REQUIRED": "缺少登录令牌，请先登录",
    "AUTH_INVALID": "登录令牌无效或已过期",
    "RBAC_DENIED": "当前角色无权执行该操作",
    "PROXY_FILL_DENIED": "代巡检员补录被拒绝：仅任务本人巡检员可提交检查结果",
    "VALIDATION_FAILED": "表单字段缺失或格式错误",
    "NOT_FOUND": "目标记录不存在",
    "TASK_NOT_OWNED": "该巡检任务不属于当前巡检员",
    "TASK_NOT_OPEN": "任务已提交/复核，不能再修改检查项",
    "TICKET_CLOSED_CONFLICT": "隐患整改单已关闭，禁止用旧巡检记录覆盖现场，冲突项已转人工复核",
    "STALE_VERSION": "数据版本已过期，请刷新后重试",
    "RATE_LIMITED": "请求过于频繁，请稍后再试",
    "INTERNAL_ERROR": "服务内部错误",
}
