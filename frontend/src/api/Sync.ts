import type {
  ReviewDecision,
  ReviewItem,
  SyncBatch,
  SyncBatchPayload
} from "../types/Sync";
import { request } from "./request";

export async function submitSyncBatch(payload: SyncBatchPayload): Promise<SyncBatch> {
  return request<SyncBatch>("/api/sync/batches", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function retrySyncBatch(batchId: string, fixes?: SyncBatchPayload): Promise<SyncBatch> {
  return request<SyncBatch>(`/api/sync/batches/${batchId}/retry`, {
    method: "POST",
    body: JSON.stringify(fixes ?? {})
  });
}

export async function listSyncBatches(): Promise<SyncBatch[]> {
  return request<SyncBatch[]>("/api/sync/batches");
}

export async function listReviewItems(status?: string): Promise<ReviewItem[]> {
  const query = status ? `?status=${status}` : "";
  return request<ReviewItem[]>(`/api/reviews${query}`);
}

export async function resolveReview(
  reviewId: number,
  decision: ReviewDecision
): Promise<ReviewItem> {
  return request<ReviewItem>(`/api/reviews/${reviewId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ decision })
  });
}
