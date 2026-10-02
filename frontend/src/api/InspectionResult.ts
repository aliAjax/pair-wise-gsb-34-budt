import { request } from "./http";
import type { InspectionResult } from "../types/InspectionResult";
import type { SyncReport, PendingResultInput } from "../types/Sync";

export async function listInspectionResult(
  taskId?: number,
  deviceId?: number,
): Promise<InspectionResult[]> {
  const params = new URLSearchParams();
  if (taskId !== undefined) params.set("task_id", String(taskId));
  if (deviceId !== undefined) params.set("device_id", String(deviceId));
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<InspectionResult[]>(`/inspection-result${query}`);
}

/** 在线/离线统一入口：仅本人巡检员可提交，代补录由后端 PROXY_FILL_DENIED 拒绝。 */
export async function syncInspectionResults(
  batchId: string,
  items: PendingResultInput[],
  submitTask = false,
): Promise<SyncReport> {
  return request<SyncReport>("/inspection-result/sync", {
    method: "POST",
    body: { batch_id: batchId, source: "OFFLINE", items, submit_task: submitTask },
  });
}
