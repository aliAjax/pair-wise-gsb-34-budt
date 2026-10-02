import { create } from "zustand";
import {
  listReviewItems,
  listSyncBatches,
  resolveReview,
  retrySyncBatch,
  submitSyncBatch
} from "../api/Sync";
import { ApiError } from "../api/request";
import { offlineOutbox } from "../utils/offlineOutbox";
import type {
  OfflineResultDraft,
  ReviewDecision,
  ReviewItem,
  SyncBatch
} from "../types/Sync";

interface SyncState {
  offlineCount: number;
  online: boolean;
  lastMessage: string;
  batches: SyncBatch[];
  reviews: ReviewItem[];
  pendingReviews: ReviewItem[];
  syncing: boolean;

  refreshOutbox: () => void;
  setOnline: (online: boolean) => void;
  queueOffline: (draft: OfflineResultDraft) => void;
  flush: () => Promise<SyncBatch | null>;
  retry: (batchId: string) => Promise<SyncBatch>;
  loadBatches: () => Promise<void>;
  loadReviews: () => Promise<void>;
  resolve: (reviewId: number, decision: ReviewDecision) => Promise<void>;
}

function batchId() {
  return `web-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  offlineCount: offlineOutbox.size(),
  online: navigator.onLine,
  lastMessage: "",
  batches: [],
  reviews: [],
  pendingReviews: [],
  syncing: false,

  refreshOutbox() {
    set({ offlineCount: offlineOutbox.size() });
  },

  setOnline(online) {
    set({ online });
    if (online) void get().flush();
  },

  queueOffline(draft) {
    offlineOutbox.add(draft);
    set({ offlineCount: offlineOutbox.size(), lastMessage: "已存入本机离线队列，恢复网络后自动合并" });
  },

  async flush() {
    const items = offlineOutbox.list();
    if (items.length === 0) return null;
    set({ syncing: true });
    const id = batchId();
    try {
      const result = await submitSyncBatch({
        batch_id: id,
        client_meta: { source: "web-offline-outbox" },
        items
      });
      // 已合并/已拒绝/已生成复核的条目出队；仅 FAILED 保留以便重试（保留已合并部分）。
      const failedIds = result.items
        .filter((i) => i.status === "FAILED")
        .map((i) => i.client_result_id);
      const finished = items.filter((i) => !failedIds.includes(i.client_result_id))
        .map((i) => i.client_result_id);
      offlineOutbox.removeMany(finished);
      set({
        offlineCount: offlineOutbox.size(),
        lastMessage: `合并 ${result.merged} 条，冲突 ${result.conflict} 条，失败 ${result.failed} 条`
      });
      await get().loadBatches();
      await get().loadReviews();
      return result;
    } catch (err) {
      if (err instanceof ApiError && err.code === "PROXY_FORBIDDEN") {
        // 代补录被整批拒绝：清出队列，避免反复重试。
        offlineOutbox.clear();
        set({ offlineCount: 0, lastMessage: err.message });
      } else if (err instanceof ApiError && err.code === "NETWORK_ERROR") {
        set({ lastMessage: "仍处于断网状态，结果保留在本机等待恢复" });
      } else {
        set({ lastMessage: (err as Error).message });
      }
      return null;
    } finally {
      set({ syncing: false });
    }
  },

  async retry(identifier) {
    const result = await retrySyncBatch(identifier);
    offlineOutbox.clear();
    set({ offlineCount: 0, lastMessage: `重试完成：合并 ${result.merged} 条，失败 ${result.failed} 条` });
    await get().loadBatches();
    await get().loadReviews();
    return result;
  },

  async loadBatches() {
    set({ batches: await listSyncBatches() });
  },

  async loadReviews() {
    const [all, pending] = await Promise.all([
      listReviewItems(),
      listReviewItems("PENDING")
    ]);
    set({ reviews: all, pendingReviews: pending });
  },

  async resolve(reviewId, decision) {
    await resolveReview(reviewId, decision);
    set({ lastMessage: decision === "KEEP_SERVER" ? "已保留现场记录" : "已采用巡检员记录并重算达标率" });
    await get().loadReviews();
    await get().loadBatches();
  }
}));
