import { useEffect, useMemo, useState } from "react";
import { ChecklistPanel } from "../components/common/ChecklistPanel";
import { StatusBadge } from "../components/common/StatusBadge";
import { TimelineList } from "../components/common/TimelineList";
import { InspectionStatusText } from "../constants/InspectionStatus";
import { BatchStatusText, SyncItemStatusText } from "../constants/SyncStatus";
import { listInspectionTask } from "../api/InspectionTask";
import { listFireDevice } from "../api/FireDevice";
import { useAuthStore } from "../stores/AuthStore";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { useSyncStore } from "../stores/SyncStore";
import type { FireDevice } from "../types/FireDevice";
import type { InspectionTask } from "../types/InspectionTask";

export function TasksPage() {
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [devices, setDevices] = useState<FireDevice[]>([]);
  const [taskId, setTaskId] = useState<number>(1);
  const { batches, loadBatches } = useSyncStore();
  useOfflineSync();

  useEffect(() => {
    void listInspectionTask().then((rows) => {
      setTasks(rows);
      const mine = rows.find((t) => t.inspector_id === user?.id) ?? rows[0];
      if (mine) setTaskId(mine.id);
    });
    void listFireDevice().then(setDevices);
    void loadBatches();
  }, [loadBatches, user?.id]);

  const taskDevices = useMemo(() => {
    const task = tasks.find((t) => t.id === taskId);
    return devices.filter((d) => d.building_id === task?.building_id);
  }, [tasks, devices, taskId]);

  const isInspector = user?.role === "INSPECTOR";
  const timeline = batches.slice().reverse().map((b) => ({
    id: b.id,
    title: `批次 ${b.id}：${BatchStatusText[b.status] ?? b.status}（合并 ${b.merged}/${b.total}，冲突 ${b.conflict}，失败 ${b.failed}）`,
    time: b.updated_at ?? b.created_at ?? "",
    tone: b.conflict ? "warn" : b.failed ? "bad" : "ok",
    meta: b.items.map((i) => `设备#${i.device_id}:${SyncItemStatusText[i.status] ?? i.status}`).join("，")
  }));

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">inspection tasks</p>
          <h1>巡检任务</h1>
        </div>
        <StatusBadge value={isInspector ? "IN_PROGRESS" : "REVIEWED"}
          label={isInspector ? "可填写检查项" : "只读视图"} />
      </section>

      <section className="workbench">
        <div className="panel wide">
          <div className="toolbar">
            <h2>我的任务</h2>
            <select value={taskId} onChange={(e) => setTaskId(Number(e.target.value))}>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} {t.plan_date} {t.task_type}（{InspectionStatusText[t.status as keyof typeof InspectionStatusText] ?? t.status}）
                </option>
              ))}
            </select>
          </div>
          <div className="table">
            {tasks.filter((t) => t.id === taskId).map((t) => (
              <article key={t.id} className="row">
                <strong>任务 #{t.id}</strong>
                <StatusBadge value={t.status} label={InspectionStatusText[t.status as keyof typeof InspectionStatusText] ?? t.status} />
                <span className="muted">楼栋 #{t.building_id} · 检查表版本 {t.checklist_version} · 计划 {t.plan_date}</span>
              </article>
            ))}
          </div>

          {isInspector ? (
            <>
              <h2>检查项（地下室断网可继续填写）</h2>
              <ChecklistPanel taskId={taskId} devices={taskDevices.length ? taskDevices : devices} />
            </>
          ) : (
            <p className="inline-hint">审计员/物业主管/维保商只读巡检任务；代巡检员补录会在同步时被拒绝。</p>
          )}
        </div>

        <div className="panel">
          <h2>同步批次</h2>
          <TimelineList entries={timeline} />
        </div>
      </section>
    </main>
  );
}
