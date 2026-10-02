import type { InspectionResult } from "../types/InspectionResult";

export const createDefaultInspectionResult = (
  overrides: Partial<InspectionResult> = {},
): InspectionResult => ({
  id: 0,
  task_id: 1,
  device_id: 1,
  item_code: "",
  result_status: "NOT_DONE",
  measured_value: "",
  photo_url: "",
  note: "",
  recorded_at: "",
  source: "OFFLINE",
  valid: true,
  invalid_reason: null,
  client_uuid: null,
  ...overrides,
});

export const createInspectionResultForm = createDefaultInspectionResult;
export const createInspectionResultResponse = createDefaultInspectionResult;
