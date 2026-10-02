import { useMemo } from "react";
import type { InspectionResult } from "../types/InspectionResult";

type ChecklistLike = Pick<InspectionResult, "result_status">;

/**
 * 巡检清单完成度：断网时巡检员每填一项本机队列 +1，
 * 恢复网络合并完成后切换为服务端结果统计。
 */
export function useChecklistProgress(
  serverResults: ChecklistLike[] = [],
  offlineCount = 0,
  totalItems = 0,
) {
  return useMemo(() => {
    const done = new Set(serverResults.filter((r) => r.result_status !== "NOT_DONE")).size
      + offlineCount;
    const denominator = Math.max(totalItems, serverResults.length + offlineCount, 1);
    const percent = Math.min(100, Math.round((done / denominator) * 100));
    const abnormal = serverResults.filter((r) => r.result_status === "ABNORMAL").length;
    return { done, total: denominator, percent, abnormal, offlineCount };
  }, [serverResults, offlineCount, totalItems]);
}
