/** 复核项：设备台账与合规总览共用同一份结构与数据源。 */
export interface ReviewItem {
  id: number;
  kind: "SYNC_CONFLICT" | "DEVICE_HISTORY" | "RATE_RECOMPUTE" | string;
  ref_type: string;
  ref_id: number;
  conflict_type: string;
  building_id: number | null;
  device_id: number | null;
  task_id: number | null;
  client_uuid: string | null;
  batch_id: string | null;
  server_snapshot: Record<string, unknown> | null;
  client_payload: Record<string, unknown> | null;
  resolution: "PENDING" | "CONFIRMED" | "OVERRIDDEN" | string;
  reviewer_id: number | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}
