import { request } from "./http";
import { listQueuedResults, removeSucceeded, archiveConflicts } from "./offlineQueue";
import type { SyncReport } from "../types/Sync";

/**
 * 网络恢复后的同步引擎：
 * 1. 读取本机队列，按 batch_id 整批提交；batch_id 稳定，服务端据此做重试幂等。
 * 2. merged/skipped 的条目从本机移除（已合并部分保留在服务端）。
 * 3. conflicts 转复核中心，不再重复同步。
 * 4. failed 条目保留在本机队列，下次网络恢复时继续重试。
 */
function stableBatchId(): string {
  const stored = localStorage.getItem("fire_inspect_batch_id");
  if (stored) return stored;
  const id = `batch-${Date.now().toString(36)}`;
  localStorage.setItem("fire_inspect_batch_id", id);
  return id;
}

export async function flushOfflineQueue(submitTask = false): Promise<SyncReport | null> {
  const items = listQueuedResults();
  if (items.length === 0) return null;
  const batch_id = stableBatchId();

  const report = await request<SyncReport>("/inspection-result/sync", {
    method: "POST",
    body: { batch_id, source: "OFFLINE", items, submit_task: submitTask },
  });

  // 已合并 + 幂等跳过：本机丢弃；冲突：归档到复核中心；失败：保留待重试
  const done = [...report.merged, ...report.skipped];
  removeSucceeded(done);
  archiveConflicts(report.conflicts.map((c) => c.client_uuid));

  // 全部成功/冲突后才换用新批次；仍有 failed 时保留同一 batch_id 以维持服务端幂等
  if (report.failed.length === 0) {
    localStorage.removeItem("fire_inspect_batch_id");
  }
  return report;
}
