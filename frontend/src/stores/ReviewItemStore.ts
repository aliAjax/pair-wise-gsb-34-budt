import { create } from "zustand";
import { listReviewItems, resolveReviewItem } from "../api/ReviewItem";
import type { ReviewItem } from "../types/ReviewItem";

/**
 * 全局唯一复核结果 store。
 * 消防设备台账页与消防合规总览页都订阅它，杜绝两处各维护一份冲突列表。
 */
type ReviewState = {
  rows: ReviewItem[];
  loading: boolean;
  load: (options?: { pendingOnly?: boolean; buildingId?: number }) => Promise<void>;
  resolve: (id: number, resolution: "CONFIRMED" | "OVERRIDDEN", note: string) => Promise<void>;
  pendingCount: () => number;
};

export const useReviewStore = create<ReviewState>((set, get) => ({
  rows: [],
  loading: false,
  async load(options) {
    set({ loading: true });
    try {
      set({ rows: await listReviewItems(options), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  async resolve(id, resolution, note) {
    await resolveReviewItem(id, resolution, note);
    set({ rows: get().rows.map((r) => (r.id === id ? { ...r, resolution } : r)) });
    await get().load();
  },
  pendingCount() {
    return get().rows.filter((r) => r.resolution === "PENDING").length;
  },
}));
