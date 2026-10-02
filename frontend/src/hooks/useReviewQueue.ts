import { useSyncStore } from "../stores/SyncStore";
import type { ReviewDecision } from "../types/Sync";

/** 冲突复核操作；设备台账与合规总览共用同一份复核结果 store。 */
export function useReviewQueue() {
  const pendingReviews = useSyncStore((s) => s.pendingReviews);
  const reviews = useSyncStore((s) => s.reviews);
  const loadReviews = useSyncStore((s) => s.loadReviews);
  const resolve = useSyncStore((s) => s.resolve);
  const lastMessage = useSyncStore((s) => s.lastMessage);

  return {
    reviews,
    pendingReviews,
    loadReviews,
    lastMessage,
    keepServer: (reviewId: number) => resolve(reviewId, "KEEP_SERVER" as ReviewDecision),
    takeClient: (reviewId: number) => resolve(reviewId, "TAKE_CLIENT" as ReviewDecision)
  };
}
