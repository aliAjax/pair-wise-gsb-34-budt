import { useEffect } from "react";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { ReviewConflictPanel } from "../components/common/ReviewConflictPanel";
import { TimelineList } from "../components/common/TimelineList";
import { useBuildingStore } from "../stores/BuildingStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { useSyncStore } from "../stores/SyncStore";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { formatPercent } from "../utils/formatters";

export function DashboardPage() {
  const { overview, loadOverview } = useBuildingStore();
  const { rows: tickets, load: loadTickets } = useHazardTicketStore();
  const { batches, loadBatches, offlineCount } = useSyncStore();
  useOfflineSync();

  useEffect(() => {
    void loadOverview();
    void loadTickets();
    void loadBatches();
  }, [loadOverview, loadTickets, loadBatches]);

  const totalDevices = overview.reduce((s, b) => s + b.total_devices, 0);
  const compliant = overview.reduce((s, b) => s + b.compliant_devices, 0);
  const openTickets = tickets.filter((t) => t.rectify_status !== "CLOSED");
  const globalRate = totalDevices ? Math.round((compliant / totalDevices) * 1000) / 10 : 0;

  const timeline = batches.slice().reverse().flatMap((b) =>
    b.items.filter((i) => i.status === "CONFLICT").map((i) => ({
      id: `${b.id}-${i.client_result_id}`,
      title: `批次 ${b.id}：设备 #${i.device_id} 结果冲突待复核（${i.reason}）`,
      time: b.updated_at ?? b.created_at ?? "",
      tone: "warn",
      meta: b.submitted_by_name
    }))
  ).slice(0, 8);

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">compliance overview</p>
          <h1>消防合规总览</h1>
        </div>
        <StatusBadge value={offlineCount ? "PENDING" : "REVIEWED"}
          label={offlineCount ? `本机待同步 ${offlineCount} 条` : "数据已同步"} />
      </section>

      <section className="metrics">
        <StatCard label="全园达标率" value={formatPercent(globalRate)} tone={globalRate >= 80 ? "good" : "warn"} />
        <StatCard label="达标设备" value={`${compliant}/${totalDevices}`} />
        <StatCard label="未关闭隐患" value={openTickets.length} tone={openTickets.length ? "bad" : "good"} />
      </section>

      <section className="panel">
        <h2>楼栋达标率（旧巡检结果失效后自动重算）</h2>
        <div className="table">
          {overview.map((b) => (
            <article key={b.building_id} className="row">
              <strong>{b.building_name}</strong>
              <span className="rate-bar">
                <i style={{ width: `${b.compliance_rate}%` }} className={b.compliance_rate >= 80 ? "good" : ""} />
              </span>
              <StatusBadge value={b.compliance_rate >= 80 ? "NORMAL" : "FAULT"} label={formatPercent(b.compliance_rate)} />
              <span className="muted">异常 {b.abnormal_devices} · 漏检 {b.missed_devices}</span>
            </article>
          ))}
        </div>
      </section>

      <ReviewConflictPanel />

      <section className="panel">
        <h2>同步冲突动态</h2>
        <TimelineList entries={timeline} />
      </section>
    </main>
  );
}
