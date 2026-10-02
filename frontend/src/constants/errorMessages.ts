import type { ErrorCode } from "./errorCodes";

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限（审计员仅可查看）",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  SYNC_BATCH_NOT_FOUND: "同步批次不存在，可能已被清理",
  SYNC_BATCH_FINISHED: "该批次已完成合并，不能重复提交",
  RESULT_NOT_FOUND: "巡检结果不存在",
  TASK_NOT_FOUND: "巡检任务不存在",
  DEVICE_NOT_FOUND: "消防设备不存在",
  STALE_VERSION: "记录已被他人更新，请刷新后复核",
  PROXY_FORBIDDEN: "禁止代巡检员补录：只能提交本人任务",
  REVIEW_NOT_FOUND: "复核项不存在",
  REVIEW_ALREADY_RESOLVED: "该复核项已处置",
  REVIEW_DECISION_INVALID: "复核决定无效",
  INTERNAL_ERROR: "服务异常，请稍后重试"
};
