import type { PendingResultInput } from "../types/Sync";

/**
 * 地下室断网场景的本机暂存队列（localStorage）。
 * - 断网时检查项照常写入本机队列，不阻塞巡检员填表。
 * - 每条记录带 client_uuid，作为恢复网络后整批合并/重试的幂等键。
 * - 已合并的条目从队列移除；失败条目保留，等待下次重试（已合并部分不丢、不重）。
 */
const QUEUE_KEY = "fire_inspect_offline_queue";

function readQueue(): PendingResultInput[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as PendingResultInput[];
  } catch {
    return [];
  }
}

function writeQueue(rows: PendingResultInput[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("offline-queue-changed"));
}

export function enqueueResult(item: PendingResultInput) {
  const rows = readQueue();
  if (rows.some((r) => r.client_uuid === item.client_uuid)) return readQueue();
  rows.push(item);
  writeQueue(rows);
  return rows;
}

export function listQueuedResults(): PendingResultInput[] {
  return readQueue();
}

/** 合并成功/幂等跳过后，从本机队列移除这些条目（保留失败/冲突条目）。 */
export function removeSucceeded(uuids: string[]) {
  const done = new Set(uuids);
  writeQueue(readQueue().filter((r) => !done.has(r.client_uuid)));
}

/** 冲突转复核的条目也从"待同步队列"移除，但保留在冲突列表中供复核中心展示。 */
export function archiveConflicts(uuids: string[]) {
  removeSucceeded(uuids);
}

export function clearQueue() {
  writeQueue([]);
}

export function newClientUuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
