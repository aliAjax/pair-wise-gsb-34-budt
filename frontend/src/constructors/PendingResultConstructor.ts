import type { PendingResultInput } from "../types/Sync";

/** 断网巡检填表时的本机检查项构造器（不含 client_uuid，由 offlineQueue 生成）。 */
export const createPendingResult = (
  overrides: Partial<Omit<PendingResultInput, "client_uuid">> = {},
): Omit<PendingResultInput, "client_uuid"> => ({
  task_id: 1,
  device_id: 1,
  item_code: "",
  result_status: "QUALIFIED",
  measured_value: "",
  photo_url: "",
  note: "",
  recorded_at: new Date().toISOString(),
  ...overrides,
});
