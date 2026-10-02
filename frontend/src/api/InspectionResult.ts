import type { InspectionResult } from "../types/InspectionResult";
import { request } from "./request";

const endpoint = "/api/inspection-result";

export async function listInspectionResult(deviceId?: number): Promise<InspectionResult[]> {
  const query = deviceId ? `?device_id=${deviceId}` : "";
  return request<InspectionResult[]>(`${endpoint}${query}`);
}
