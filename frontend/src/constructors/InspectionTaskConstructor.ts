import type { InspectionTask } from "../types/InspectionTask";

export const createDefaultInspectionTask = (
  overrides: Partial<InspectionTask> = {},
): InspectionTask => ({
  id: 0,
  building_id: 1,
  inspector_id: 1,
  plan_date: "",
  task_type: "MONTHLY",
  status: "PLANNED",
  checklist_version: "CL-2026-09",
  finished_at: null,
  ...overrides,
});

export const createInspectionTaskForm = createDefaultInspectionTask;
export const createInspectionTaskResponse = createDefaultInspectionTask;
