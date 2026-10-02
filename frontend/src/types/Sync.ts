/** 离线暂存的检查项（localStorage 队列元素）。 */
export interface PendingResultInput {
  client_uuid: string;
  task_id: number;
  device_id: number;
  item_code: string;
  result_status: string;
  measured_value?: string;
  photo_url?: string;
  note?: string;
  recorded_at: string;
}

export interface SyncConflictOutcome {
  client_uuid: string;
  conflict_type: string;
  review_id: number;
}

export interface SyncFailure {
  client_uuid: string;
  code: string;
  message: string;
}

/** POST /api/inspection-result/sync 响应：已合并部分与待重试部分分开返回。 */
export interface SyncReport {
  batch_id: string;
  merged: string[];
  skipped: string[];
  conflicts: SyncConflictOutcome[];
  failed: SyncFailure[];
  task_submitted: number | null;
  merged_count: number;
  conflict_count: number;
  has_more: boolean;
}
