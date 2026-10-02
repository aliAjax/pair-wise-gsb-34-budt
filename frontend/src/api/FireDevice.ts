import { mockData } from "../mocks/seedData";
import type { FireDevice } from "../types/FireDevice";
import { request } from "./request";

const endpoint = "/api/fire-device";

export async function listFireDevice(): Promise<FireDevice[]> {
  try {
    return await request<FireDevice[]>(endpoint);
  } catch (err) {
    if ((err as { status?: number }).status === 401) throw err;
    // 后端不可达时保留只读 mock，台账仍可离线浏览。
    return [...(mockData.fireDevice as unknown as FireDevice[])];
  }
}

export async function updateFireDeviceStatus(deviceId: number, status: string): Promise<FireDevice> {
  return request<FireDevice>(`${endpoint}/${deviceId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
