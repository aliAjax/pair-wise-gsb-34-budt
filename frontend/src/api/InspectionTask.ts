import { mockData } from "../mocks/seedData";
import type { InspectionTask } from "../types/InspectionTask";
import { request } from "./request";

const endpoint = "/api/inspection-task";

export async function listInspectionTask(): Promise<InspectionTask[]> {
  try {
    return await request<InspectionTask[]>(endpoint);
  } catch {
    return [...(mockData.inspectionTask as unknown as InspectionTask[])];
  }
}

export async function saveInspectionTask(payload: InspectionTask) {
  console.info("save InspectionTask", payload);
  return payload;
}
