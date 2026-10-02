import { request } from "./http";
import type { InspectionTask } from "../types/InspectionTask";

export async function listInspectionTask(buildingId?: number): Promise<InspectionTask[]> {
  const query = buildingId ? `?building_id=${buildingId}` : "";
  return request<InspectionTask[]>(`/inspection-task${query}`);
}

export async function claimInspectionTask(taskId: number): Promise<InspectionTask> {
  return request<InspectionTask>(`/inspection-task/${taskId}/claim`, { method: "POST" });
}

export async function reviewInspectionTask(
  taskId: number,
  approved: boolean,
): Promise<InspectionTask> {
  return request<InspectionTask>(`/inspection-task/${taskId}/review?approved=${approved}`, {
    method: "POST",
  });
}
