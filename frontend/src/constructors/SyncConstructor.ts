import type { OfflineResultDraft, SyncBatchPayload } from "../types/Sync";

let seq = 0;

function localId() {
  seq += 1;
  return `local-${Date.now()}-${seq}`;
}

export function createOfflineDraft(overrides: Partial<OfflineResultDraft> = {}): OfflineResultDraft {
  return {
    client_result_id: localId(),
    task_id: 1,
    device_id: 1,
    item_code: "",
    result_status: "NORMAL",
    measured_value: "",
    photo_url: "",
    note: "",
    captured_at: new Date().toISOString().slice(0, 19) + "Z",
    base_device_version: 1,
    ...overrides
  };
}

export function createSyncBatchPayload(items: OfflineResultDraft[]): SyncBatchPayload {
  return {
    batch_id: `batch-${Date.now()}`,
    client_meta: { source: "web", device: navigator.userAgent },
    items
  };
}
