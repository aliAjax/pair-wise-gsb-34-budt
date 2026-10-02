import { useEffect, useState } from "react";
import { useBuildingStore } from "../stores/BuildingStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { listAuditLogs } from "../api/AuditLog";
import { useRbac } from "../hooks/useRbac";
import { StatCard } from "../components/common/StatCard";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge } from "../components/common/StatusBadge";
import { ApiError } from "../api/http";
import { formatPercent, formatDate } from "../utils/formatters";
import type { AuditLogEntry } from "../types/AuditLog";

export function ReportsPage() {
  const { overview, loadOverview } = useBuildingStore();
  const { rows: tickets, load: loadTickets } = useHazardTicketStore();
  const { isAuditor, isSupervisor } = useRbac();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logError, setLogError] = useState("");

  useEffect(() => {
    void loadOverview().catch(() => undefined);
    void loadTickets().catch(() => undefined);
    if (isAuditor || isSupervisor) {
      listAuditLogs().then(setLogs).catch((e) =>
        setLogError(e instanceof ApiError ? e.message : String(e)));
    }
  }, [loadOverview, loadTickets, isAuditor, isSupervisor]);

  const closed = tickets.filter((t) => t.rectify_status === "CLOSED").length;
  const rectifyRate = tickets.length ? closed / tickets.length : 0;

  return (
    <section className="page-stack">
      <header className="page-title">
        <h1>合规报表</h1>
        <p>巡检率/整改率/楼栋达标率统一来自后端重算结果；审计员在此可查阅全部操作日志。</p>
      </header>

      <div className="metrics">
        <StatCard label="楼栋平均达标率"
          value={formatPercent(overview.reduce((s, b) => s + (b.compliance_rate ?? 0), 0) / (overview.length || 1))} />
        <StatCard label="整改完成率" value={formatPercent(rectifyRate)}
          tone={rectifyRate >= 0.8 ? "ok" : "warn"} />
        <StatCard label="隐患单总数" value={tickets.length} />
      </div>

      <div className="panel">
        <h2>楼栋达标率分布</h2>
        {overview.length === 0 ? <EmptyState title="暂无统计" /> : (
          <div className="bar-chart">
            {overview.map((b) => (
              <div key={b.id} className="bar-row">
                <span className="bar-label">{b.name}</span>
                <div className="bar-track">
                  <i className={(b.compliance_rate ?? 0) >= 0.8 ? "bar-ok" : "bar-low"}
                    style={{ width: `${(b.compliance_rate ?? 0) * 100}%` }} />
                </div>
                <span className="bar-value">{formatPercent(b.compliance_rate ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(isAuditor || isSupervisor) && (
        <div className="panel">
          <h2>操作日志（{isAuditor ? "审计员只读视图" : "主管视图"}）</h2>
          {logError && <div className="alert alert-error">{logError}</div>}
          {logs.length === 0 && !logError ? <EmptyState title="暂无日志" /> : (
            <table className="table">
              <thead>
                <tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>说明</th></tr>
              </thead>
              <tbody>
                {logs.slice().reverse().map((l) => (
                  <tr key={l.id}>
                    <td>{formatDate(l.created_at)}</td>
                    <td>{l.actor}</td>
                    <td><StatusBadge value={l.action} label={l.action} /></td>
                    <td>{l.target_type}#{l.target_id}</td>
                    <td>{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
