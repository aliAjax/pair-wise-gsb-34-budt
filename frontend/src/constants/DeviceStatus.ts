export const DeviceStatus = ["NORMAL", "FAULT", "RECTIFYING", "SCRAPPED"] as const;
export type DeviceStatus = (typeof DeviceStatus)[number];
export const DeviceStatusText: Record<DeviceStatus, string> = {
  NORMAL: "正常",
  FAULT: "故障",
  RECTIFYING: "整改中",
  SCRAPPED: "报废",
};
