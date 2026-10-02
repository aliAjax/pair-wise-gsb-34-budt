import { request } from "./http";
import type { FireDevice } from "../types/FireDevice";
import type { InspectionResult } from "../types/InspectionResult";
import type { ReviewItem } from "../types/ReviewItem";

export async function listFireDevice(buildingId?: number): Promise<FireDevice[]> {
  const query = buildingId ? `?building_id=${buildingId}` : "";
  return request<FireDevice[]>(`/fire-device${query}`);
}

export interface DeviceHistory {
  device: FireDevice;
  results: InspectionResult[];
  reviews: ReviewItem[];
}

export async function getDeviceHistory(deviceId: number): Promise<DeviceHistory> {
  return request<DeviceHistory>(`/fire-device/${deviceId}/history`);
}

/** 物业主管更新设备状态：触发旧结果失效 + 达标率重算。 */
export async function updateDeviceStatus(
  deviceId: number,
  status: string,
  expectedVersion?: number,
  note?: string,
): Promise<FireDevice> {
  return request<FireDevice>(`/fire-device/${deviceId}/status`, {
    method: "PATCH",
    body: { status, expected_version: expectedVersion ?? null, note: note ?? null },
  });
}
