import { create } from "zustand";
import {
  listQueuedResults,
  enqueueResult,
  newClientUuid,
} from "../api/offlineQueue";
import { flushOfflineQueue } from "../api/syncEngine";
import type { PendingResultInput, SyncReport } from "../types/Sync";

export type SyncStage = "IDLE" | "OFFLINE" | "SYNCING" | "SYNCED" | "PARTIAL" | "FAILED";

type OfflineState = {
  online: boolean;
  stage: SyncStage;
  queued: PendingResultInput[];
  lastReport: SyncReport | null;
  notice: string;
  refreshQueue: () => void;
  setOnline: (online: boolean) => void;
  recordResult: (input: Omit<PendingResultInput, "client_uuid" | "recorded_at"> & {
    recorded_at?: string;
  }) => { queued: boolean; client_uuid: string };
  flush: (submitTask?: boolean) => Promise<SyncReport | null>;
};

export const useOfflineStore = create<OfflineState>((set, get) => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  stage: "IDLE",
  queued: listQueuedResults(),
  lastReport: null,
  notice: "",

  refreshQueue() {
    set({ queued: listQueuedResults() });
  },

  setOnline(online) {
    set({ online });
    if (online) {
      // 网络恢复：自动把本机队列合并回设备台账
      void get().flush();
    }
  },

  // 断网时巡检员仍可继续填：一律先落本机队列，联网后再合并
  recordResult(input) {
    const item: PendingResultInput = {
      ...input,
      client_uuid: newClientUuid(),
      recorded_at: input.recorded_at ?? new Date().toISOString(),
    };
    const queued = enqueueResult(item);
    set({
      queued,
      stage: get().online ? "IDLE" : "OFFLINE",
      notice: get().online ? "" : "当前离线，结果已保存在本机，联网后自动合并",
    });
    // 在线时也允许立即尝试合并；离线则等 online 事件
    if (get().online) void get().flush();
    return { queued: true, client_uuid: item.client_uuid };
  },

  async flush(submitTask = false) {
    if (listQueuedResults().length === 0) {
      set({ stage: "IDLE" });
      return null;
    }
    set({ stage: "SYNCING", notice: "正在合并本机巡检结果…" });
    try {
      const report = await flushOfflineQueue(submitTask);
      get().refreshQueue();
      if (!report) {
        set({ stage: "IDLE" });
        return null;
      }
      const remaining = listQueuedResults().length;
      set({
        lastReport: report,
        stage: remaining > 0 || report.failed.length > 0 ? "PARTIAL" : "SYNCED",
        notice:
          report.conflict_count > 0
            ? `已合并 ${report.merged_count} 条，${report.conflict_count} 条冲突已转复核`
            : remaining > 0
              ? `已保留合并部分，${remaining} 条待网络恢复后重试`
              : `已合并 ${report.merged_count} 条巡检结果`,
      });
      return report;
    } catch {
      get().refreshQueue();
      // 同步失败：已合并部分保留在服务端，本机剩余条目等待重试
      set({ stage: "FAILED", notice: "同步失败，已合并部分已保留，将在网络恢复后重试" });
      return null;
    }
  },
}));
