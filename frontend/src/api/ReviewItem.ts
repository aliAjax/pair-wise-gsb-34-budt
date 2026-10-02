import { request } from "./http";
import type { ReviewItem } from "../types/ReviewItem";

/**
 * 复核中心唯一数据入口：设备台账页（DEVICE_HISTORY）与
 * 消防合规总览页（SYNC_CONFLICT）共用此 store/接口，保证同一份复核结果。
 */
export async function listReviewItems(options: {
  pendingOnly?: boolean;
  buildingId?: number;
} = {}): Promise<ReviewItem[]> {
  const params = new URLSearchParams();
  if (options.pendingOnly) params.set("pending_only", "true");
  if (options.buildingId !== undefined) params.set("building_id", String(options.buildingId));
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<ReviewItem[]>(`/review-item${query}`);
}

export async function resolveReviewItem(
  reviewId: number,
  resolution: "CONFIRMED" | "OVERRIDDEN",
  note: string,
): Promise<ReviewItem> {
  return request<ReviewItem>(`/review-item/${reviewId}/resolve`, {
    method: "POST",
    body: { resolution, note },
  });
}
