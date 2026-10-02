export const DeviceStatus = ["NORMAL", "FAULT", "MAINTAINING", "SCRAPPED"] as const;
export type DeviceStatus = (typeof DeviceStatus)[number];

export const DeviceStatusText: Record<DeviceStatus, string> = {
  NORMAL: "正常",
  FAULT: "故障",
  MAINTAINING: "维保中",
  SCRAPPED: "报废"
};

export const ResultStatusText: Record<string, string> = {
  NORMAL: "正常",
  ABNORMAL: "异常"
};

export const ConflictReasonText: Record<string, string> = {
  DEVICE_STATUS_CHANGED: "主管已更新设备状态，旧结果失效",
  RESULT_SUPERSEDED: "现场已有更新的有效巡检结果",
  HAZARD_CLOSED: "隐患整改单已关闭，禁止旧异常覆盖现场"
};

export const SyncItemStatusText: Record<string, string> = {
  PENDING: "待处理",
  MERGED: "已合并",
  CONFLICT: "冲突待复核",
  REJECTED: "已拒绝",
  FAILED: "失败",
  RESOLVED: "复核已处置"
};

export const BatchStatusText: Record<string, string> = {
  MERGING: "合并中",
  MERGED: "已全部合并",
  CONFLICT: "存在冲突",
  FAILED: "部分失败"
};

export const ReviewDecisionText: Record<string, string> = {
  KEEP_SERVER: "保留现场（服务端）",
  TAKE_CLIENT: "采用巡检员记录（客户端）"
};
