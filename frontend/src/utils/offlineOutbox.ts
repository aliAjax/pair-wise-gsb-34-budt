import type { OfflineResultDraft } from "../types/Sync";

const OUTBOX_KEY = "fire-inspect-offline-outbox";

function read(): OfflineResultDraft[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]") as OfflineResultDraft[];
  } catch {
    return [];
  }
}

function write(rows: OfflineResultDraft[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("offline-outbox-changed"));
}

export const offlineOutbox = {
  list(): OfflineResultDraft[] {
    return read();
  },

  size(): number {
    return read().length;
  },

  add(draft: OfflineResultDraft): OfflineResultDraft[] {
    const rows = read();
    // 幂等：同一 client_result_id 只保留最新一版。
    const idx = rows.findIndex((r) => r.client_result_id === draft.client_result_id);
    if (idx >= 0) rows[idx] = draft;
    else rows.push(draft);
    write(rows);
    return rows;
  },

  removeMany(clientIds: string[]) {
    const dropped = new Set(clientIds);
    write(read().filter((r) => !dropped.has(r.client_result_id)));
  },

  clear() {
    write([]);
  }
};
