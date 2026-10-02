export const RectifyStatus = ["OPEN", "REPAIRING", "RECHECKING", "CLOSED"] as const;
export type RectifyStatus = (typeof RectifyStatus)[number];
export const RectifyStatusText: Record<RectifyStatus, string> = {
  OPEN: "待整改",
  REPAIRING: "整改中",
  RECHECKING: "待复验",
  CLOSED: "已关闭",
};
