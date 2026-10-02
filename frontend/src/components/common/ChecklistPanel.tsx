import { useChecklistProgress } from "../../hooks/useChecklistProgress";

interface ChecklistPanelProps {
  results: { result_status: string }[];
  offlineCount?: number;
  totalItems?: number;
}

/** 巡检任务页共享：展示完成度，断网部分单独标识。 */
export function ChecklistPanel({ results, offlineCount = 0, totalItems = 0 }: ChecklistPanelProps) {
  const { percent, done, total, abnormal } = useChecklistProgress(results, offlineCount, totalItems);
  return (
    <div className="checklist-panel">
      <div className="checklist-head">
        <span>检查项完成度 {percent}%</span>
        {offlineCount > 0 && <span className="offline-chip">本机待同步 {offlineCount}</span>}
      </div>
      <div className="progress"><i style={{ width: `${percent}%` }} /></div>
      <div className="checklist-meta">
        <span>已完成 {done}/{total}</span>
        {abnormal > 0 && <span className="abnormal">异常 {abnormal}</span>}
      </div>
    </div>
  );
}
