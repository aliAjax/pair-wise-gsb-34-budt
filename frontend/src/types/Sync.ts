export type SyncItemStatus = "PENDING" | "MERGED" | "CONFLICT" | "REJECTED" | "FAILED" | "RESOLVED";
export type SyncBatchStatus = "MERGING" | "MERGED" | "CONFLICT" | "FAILED";
export type ReviewDecision = "KEEP_SERVER" | "TAKE_CLIENT";
export type ReviewStatus = "PENDING" | ReviewDecision;
export type ConflictReason = "DEVICE_STATUS_CHANGED" | "RESULT_SUPERSEDED" | "HAZARD_CLOSED";

export interface OfflineResultDraft {
  client_result_id: string;
  task_id: number;
  device_id: number;
  item_code: string;
  result_status: "NORMAL" | "ABNORMAL";
  measured_value: string;
  photo_url?: string;
  note: string;
  captured_at: string;
  base_device_version: number;
}

export interface SyncBatchItem {
  client_result_id: string;
  task_id: number;
  device_id: number;
  item_code: string;
  status: SyncItemStatus;
  server_result_id: number | null;
  review_id: number | null;
  reason: string;
}

export interface SyncBatch {
  id: string;
  status: SyncBatchStatus;
  total: number;
  merged: number;
  conflict: number;
  rejected: number;
  failed: number;
  submitted_by_name?: string;
  created_at?: string;
  updated_at?: string;
  items: SyncBatchItem[];
}

export interface SyncBatchPayload {
  batch_id: string;
  client_meta?: Record<string, unknown>;
  items: OfflineResultDraft[];
}

export interface ServerSnapshot {
  id?: number;
  status?: string;
  version?: number;
  building_id?: number;
  server_result?: {
    id: number;
    result_status: string;
    measured_value: string;
    captured_at: string;
  };
  closed_ticket?: {
    id: number;
    rectify_status: string;
    closed_at: string;
    rectify_note: string;
  };
}

export interface ReviewItem {
  id: number;
  batch_id: string;
  reason: ConflictReason;
  status: ReviewStatus;
  task_id: number;
  device_id: number;
  building_id?: number;
  item_code: string;
  result_status: string;
  measured_value: string;
  photo_url: string;
  note: string;
  captured_at: string;
  base_device_version: number;
  server_snapshot: ServerSnapshot;
  submitted_by: number;
  submitted_by_name: string;
  resolved_by: { id: number; name: string; role: string } | null;
  resolved_at: string | null;
  server_result_id: number | null;
  created_at: string;
}
