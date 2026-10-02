import { useEffect, useState } from "react";
import { StatCard } from "../components/common/StatCard";
import { EmptyState } from "../components/common/EmptyState";
import { TimelineList } from "../components/common/TimelineList";
import { listAuditLog, type AuditLogRow } from "../api/AuditLog";
import { listSyncBatches } from "../api/Sync";
import { useBuildingStore } from "../stores/BuildingStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { formatPercent } from "../utils/formatters";

/**
 * 合规报表：楼栋达标率柱状图（CSS 实现，无需第三方图表密钥）、整改率、
 * 同步批次汇总，以及审计员可见的操作日志时间线（只读）。
 */
export function ReportsPage() {
  const { overview, loadOverview } = useBuildingStore();
  const { rows: tickets, load: loadTickets } = useHazardTicketStore();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [batches, setBatches] = useState<import("../types/Sync").SyncBatch[]>([]);

  useEffect(() => {
    void loadOverview();
    void loadTickets();
    void listAuditLog().then(setLogs).catch(() => setLogs([]));
    void listSyncBatches().then(setBatches).catch(() => setBatches([]));
  }, [loadOverview, loadTickets]);

  const totalTickets = tickets.length;
  const closedTickets = tickets.filter((t) => t.rectify_status === "CLOSED").length;
  const rectifyRate = totalTickets ? Math.round((closedTickets / totalTickets) * 1000) / 10 : 0;
  const failedBatches = batches.filter((b) => b.failed > 0).length;

  const logEntries = logs.slice(0, 20).map((l) => ({
    id: l.id,
    title: `[${l.actor_role}] ${l.message}`,
    time: l.created_at,
    tone: l.message.includes("冲突") ? "warn" : l.message.includes("拒绝") || l.message.includes("403") ? "bad" : "ok",
    meta: `${l.entity} · ${l.actor_name}`
  }));

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">compliance reports</p>
          <h1>合规报表</h1>
        </div>
      </section>

      <section className="metrics">
        <StatCard label="隐患整改率" value={formatPercent(rectifyRate)} tone={rectifyRate >= 90 ? "good" : "warn"} />
        <StatCard label="已关闭/总数" value={`${closedTickets}/${totalTickets}`} />
        <StatCard label="部分失败批次" value={failedBatches} tone={failedBatches ? "bad" : "good"} />
      </section>

      <section className="panel chart-panel">
        <h2>楼栋巡检达标率（2026-10）</h2>
        {overview.length === 0 ? <EmptyState title="暂无楼栋数据" /> : (
          <div className="bar-chart">
            {overview.map((b) => (
              <div key={b.building_id} className="bar-col">
                <span>{formatPercent(b.compliance_rate)}</span>
                <div className="bar-track">
                  <i className={b.compliance_rate >= 80 ? "good" : "warn"} style={{ height: `${Math.max(b.compliance_rate, 4)}%` }} />
                </div>
                <em>{b.building_name}</em>
                <small>异常 {b.abnormal_devices} · 漏检 {b.missed_devices}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>操作审计日志（审计员只读）</h2>
        <TimelineList entries={logEntries} />
      </section>
    </main>
  );
}
