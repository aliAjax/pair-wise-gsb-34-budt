import type { InspectionResult } from "../types/InspectionResult";

export const createDefaultInspectionResult = (overrides: Partial<InspectionResult> = {}): InspectionResult => ({
  id: 1,
  task_id: 1,
  device_id: 1,
  item_code: "HYDRANT_PRESSURE",
  result_status: "NORMAL",
  measured_value: "",
  photo_url: "",
  note: "",
  effective: true,
  version: 1,
  captured_at: "",
  reviewed_at: null,
  hazard_ticket_id: null,
  ...overrides
});

export const createInspectionResultForm = createDefaultInspectionResult;
export const createInspectionResultResponse = createDefaultInspectionResult;
