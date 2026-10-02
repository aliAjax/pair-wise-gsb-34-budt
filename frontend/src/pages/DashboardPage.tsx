import { useEffect, useMemo, useState } from "react";
import { useBuildingStore } from "../stores/BuildingStore";
import { useReviewStore } from "../stores/ReviewItemStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { useRbac } from "../hooks/useRbac";
import { StatCard } from "../components/common/StatCard";
import { EmptyState } from "../components/common/EmptyState";
import { ReviewItemCard } from "../components/common/ReviewItemCard";
import { HazardSeverityTag } from "../components/common/HazardSeverityTag";
import { formatPercent, formatDay } from "../utils/formatters";
import { ApiError } from "../api/http";
import type { ReviewItem } from "../types/ReviewItem";

/**
 * 消防合规总览：
 * - 楼栋达标率由后端在设备状态更新/复核裁决后统一重算
 * - 复核冲突与设备台账页共用同一个 ReviewItemStore（同一份复核结果）
 */
export function DashboardPage() {
  const { overview, loadOverview } = useBuildingStore();
  const { rows: reviews, load: loadReviews, resolve } = useReviewStore();
  const { rows: tickets, load: loadTickets } = useHazardTicketStore();
  const { isSupervisor } = useRbac();
  const [error, setError] = useState("");

  useEffect(() => {
    void loadOverview().catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
    void loadReviews();
    void loadTickets();
  }, [loadOverview, loadReviews, loadTickets]);

  const pending = useMemo(() => reviews.filter((r) => r.resolution === "PENDING"), [reviews]);
  const openTickets = useMemo(
    () => tickets.filter((t) => t.rectify_status !== "CLOSED"),
    [tickets],
  );
  const avgRate = overview.length
    ? overview.reduce((s, b) => s + (b.compliance_rate ?? 0), 0) / overview.length
    : 0;

  async function handleResolve(item: ReviewItem, resolution: "CONFIRMED" | "OVERRIDDEN") {
    setError("");
    try {
      await resolve(item.id, resolution, "总览页人工复核");
      await loadOverview();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  return (
    <section className="page-stack">
      <header className="page-title">
        <h1>消防合规总览</h1>
        <p>楼栋达标率随设备状态与复核结论统一重算；冲突复核与设备台账共用同一数据源。</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="metrics">
        <StatCard label="平均达标率" value={formatPercent(avgRate)} tone={avgRate >= 0.8 ? "ok" : "warn"} />
        <StatCard label="楼栋数" value={overview.length} />
        <StatCard label="待复核冲突" value={pending.length} tone={pending.length ? "danger" : "ok"} />
        <StatCard label="未关闭隐患" value={openTickets.length} tone={openTickets.length ? "danger" : "ok"} />
      </div>

      <div className="panel">
        <h2>楼栋达标率</h2>
        {overview.length === 0 ? <EmptyState title="暂无楼栋数据" /> : (
          <table className="table">
            <thead>
              <tr><th>楼栋</th><th>园区</th><th>达标率</th><th>合格设备</th><th>待复核</th><th>更新时间</th></tr>
            </thead>
            <tbody>
              {overview.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.campus}</td>
                  <td>
                    <span className={(b.compliance_rate ?? 0) >= 0.8 ? "rate-ok" : "rate-low"}>
                      {formatPercent(b.compliance_rate ?? 0)}
                    </span>
                  </td>
                  <td>{b.qualified_devices ?? 0}</td>
                  <td>{b.pending_reviews ?? 0}</td>
                  <td>{formatDay(b.rate_computed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>待复核冲突（与设备台账共用）</h2>
        {pending.length === 0 ? <EmptyState title="没有待复核项" desc="离线结果与现场数据一致" /> : (
          <div className="review-grid">
            {pending.map((item) => (
              <ReviewItemCard key={item.id} item={item}
                readonly={!isSupervisor} onResolve={handleResolve} />
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>未关闭隐患</h2>
        {openTickets.length === 0 ? <EmptyState title="无未关闭隐患" /> : (
          <ul className="plain-list">
            {openTickets.map((t) => (
              <li key={t.id}>
                <HazardSeverityTag value={t.severity} />
                <span>整改单 #{t.id}（结果 #{t.result_id}）</span>
                <span>责任人 {t.owner_id}</span>
                <span>截止 {formatDay(t.deadline)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
