import { useEffect, useMemo, useState } from "react";
import { useInspectionTaskStore } from "../stores/InspectionTaskStore";
import { useFireDeviceStore } from "../stores/FireDeviceStore";
import { useInspectionResultStore } from "../stores/InspectionResultStore";
import { useOfflineStore } from "../stores/OfflineStore";
import { useRbac } from "../hooks/useRbac";
import { ChecklistPanel } from "../components/common/ChecklistPanel";
import { StatusBadge } from "../components/common/StatusBadge";
import { TimelineList } from "../components/common/TimelineList";
import { EmptyState } from "../components/common/EmptyState";
import { ApiError } from "../api/http";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { createPendingResult } from "../constructors/PendingResultConstructor";
import { formatDay } from "../utils/formatters";
import type { InspectionTask } from "../types/InspectionTask";

export function TasksPage() {
  const { rows: tasks, load, claim, review } = useInspectionTaskStore();
  const { rows: devices, load: loadDevices } = useFireDeviceStore();
  const { rows: results, load: loadResults } = useInspectionResultStore();
  const {
    online, queued, notice, stage, recordResult, flush, refreshQueue,
  } = useOfflineStore();
  const { user, isInspector, isSupervisor } = useRbac();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [itemCode, setItemCode] = useState("PRESSURE");
  const [measured, setMeasured] = useState("");
  const [resultStatus, setResultStatus] = useState("QUALIFIED");
  const [error, setError] = useState("");

  useEffect(() => {
    void load().catch((e) => setError(String(e)));
    void loadDevices();
    void loadResults();
    refreshQueue();
  }, [load, loadDevices, loadResults, refreshQueue]);

  const myTasks = useMemo(
    () => (isInspector ? tasks.filter((t) => t.inspector_id === user?.id) : tasks),
    [tasks, isInspector, user],
  );
  const active = myTasks.find((t) => t.id === activeId) ?? null;

  const devicesOfTask = (task: InspectionTask) =>
    devices.filter((d) => d.building_id === task.building_id);

  function handleRecord(task: InspectionTask) {
    setError("");
    if (!itemCode.trim()) {
      setError(ERROR_MESSAGES.VALIDATION_FAILED);
      return;
    }
    const device = devicesOfTask(task)[0];
    // 断网照常落本机；recordResult 在线时也会立即尝试合并
    recordResult(createPendingResult({
      task_id: task.id,
      device_id: device?.id ?? 1,
      item_code: itemCode,
      result_status: resultStatus,
      measured_value: measured,
    }));
    setMeasured("");
  }

  async function handleClaim(task: InspectionTask) {
    setError("");
    try {
      await claim(task.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  async function handleReview(task: InspectionTask, approved: boolean) {
    setError("");
    try {
      await review(task.id, approved);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  async function handleFlush() {
    setError("");
    const report = await flush(true);
    if (report) await loadResults();
  }

  return (
    <section className="page-stack">
      <header className="page-title">
        <h1>巡检任务</h1>
        <p>地下室断网也能继续填检查项，结果暂存本机；联网后自动合并，冲突项只转复核不覆盖现场。</p>
      </header>

      <div className={`sync-banner sync-${stage.toLowerCase()} ${online ? "" : "is-offline"}`}>
        <span className="dot" />
        <strong>{online ? "在线" : "当前离线"}</strong>
        <span>本机待同步 {queued.length} 条</span>
        {notice && <em>{notice}</em>}
        {queued.length > 0 && (
          <button className="btn btn-primary" onClick={handleFlush}>立即合并</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isInspector && myTasks.length === 0 && (
        <EmptyState title="没有分配给你的巡检任务" desc="代他人补录会被后端拒绝（PROXY_FILL_DENIED）" />
      )}

      <div className="task-grid">
        {myTasks.map((task) => {
          const taskResults = results.filter((r) => r.task_id === task.id);
          const taskOffline = activeId === task.id ? queued.filter((q) => q.task_id === task.id).length : 0;
          return (
            <article key={task.id} className="panel task-card">
              <header>
                <h2>任务 #{task.id} · {task.task_type}</h2>
                <StatusBadge value={task.status} />
              </header>
              <p className="muted">计划日期 {formatDay(task.plan_date)} · 清单版本 {task.checklist_version}</p>

              <ChecklistPanel results={taskResults} offlineCount={taskOffline}
                totalItems={devicesOfTask(task).length * 2} />

              <TimelineList entries={[
                { key: "plan", title: "已排期", at: task.plan_date },
                ...(task.finished_at ? [{ key: "finish", title: "已提交", at: task.finished_at, tone: "ok" as const }] : []),
              ]} />

              {isInspector && (
                <div className="checklist-form">
                  <select value={itemCode} onChange={(e) => setItemCode(e.target.value)}>
                    <option value="PRESSURE">压力检查</option>
                    <option value="SMOKE_TEST">烟感测试</option>
                    <option value="WATER_PRESSURE">水压检查</option>
                    <option value="EXIT_SIGN">疏散指示</option>
                  </select>
                  <select value={resultStatus} onChange={(e) => setResultStatus(e.target.value)}>
                    <option value="QUALIFIED">合格</option>
                    <option value="ABNORMAL">异常</option>
                  </select>
                  <input placeholder="测量值" value={measured} onChange={(e) => setMeasured(e.target.value)} />
                  <button className="btn btn-primary" onClick={() => { setActiveId(task.id); handleRecord(task); }}>
                    {online ? "提交/合并" : "本机暂存"}
                  </button>
                </div>
              )}

              <footer className="card-actions">
                {isInspector && task.status === "PLANNED" && (
                  <button className="btn" onClick={() => handleClaim(task)}>领取任务</button>
                )}
                {isSupervisor && task.status === "SUBMITTED" && (
                  <>
                    <button className="btn btn-primary" onClick={() => handleReview(task, true)}>复核通过</button>
                    <button className="btn" onClick={() => handleReview(task, false)}>驳回</button>
                  </>
                )}
                <button className="btn btn-ghost" onClick={() => setActiveId(activeId === task.id ? null : task.id)}>
                  {activeId === task.id ? "收起" : "详情"}
                </button>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
