import { useMemo } from "react";

export interface ChecklistItemLike {
  item_code: string;
  result_status?: string;
}

/** 巡检检查项完成度：已填判定（NORMAL/ABNORMAL）占比。 */
export function useChecklistProgress(items: ChecklistItemLike[] = []) {
  return useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.result_status === "NORMAL" || i.result_status === "ABNORMAL").length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, percent, allDone: total > 0 && done === total };
  }, [items]);
}
