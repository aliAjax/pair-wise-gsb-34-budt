/** 同步冲突类型：与后端 conflict_type 严格一致。 */
export const ConflictType = {
  DEVICE_STATUS_CHANGED: "DEVICE_STATUS_CHANGED",
  TICKET_CLOSED: "TICKET_CLOSED",
  SERVER_NEWER: "SERVER_NEWER",
  STALE_AFTER_DEVICE_STATUS: "STALE_AFTER_DEVICE_STATUS",
} as const;
export type ConflictType = (typeof ConflictType)[keyof typeof ConflictType];

export const ConflictTypeText: Record<string, string> = {
  DEVICE_STATUS_CHANGED: "设备状态已变更",
  TICKET_CLOSED: "隐患单已关闭",
  SERVER_NEWER: "服务端结果更新",
  STALE_AFTER_DEVICE_STATUS: "旧巡检结果已失效",
};

export const ReviewKindText: Record<string, string> = {
  SYNC_CONFLICT: "同步冲突",
  DEVICE_HISTORY: "旧结果失效",
  RATE_RECOMPUTE: "达标率重算",
};

export const ReviewResolution = ["PENDING", "CONFIRMED", "OVERRIDDEN"] as const;
export type ReviewResolution = (typeof ReviewResolution)[number];
export const ReviewResolutionText: Record<ReviewResolution, string> = {
  PENDING: "待复核",
  CONFIRMED: "维持现场",
  OVERRIDDEN: "人工采用",
};
