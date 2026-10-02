import { useEffect, useState } from "react";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { useRbac } from "../hooks/useRbac";
import { useHazardFlow } from "../hooks/useHazardFlow";
import { HazardSeverityTag } from "../components/common/HazardSeverityTag";
import { StatusBadge } from "../components/common/StatusBadge";
import { TimelineList } from "../components/common/TimelineList";
import { EmptyState } from "../components/common/EmptyState";
import { ApiError } from "../api/http";
import { formatDay, formatDate, formatRectifyStatus } from "../utils/formatters";
import type { HazardTicket } from "../types/HazardTicket";

export function HazardsPage() {
  const { rows, load, close } = useHazardTicketStore();
  const { can, isAuditor } = useRbac();
  const [active, setActive] = useState<HazardTicket | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const flow = useHazardFlow(async () => {
    await load();
    setActive(null);
    setNote("");
  });

  useEffect(() => {
    void load().catch((e) => setError(String(e)));
  }, [load]);

  async function handleClose() {
    setError("");
    if (!active) return;
    const ok = await flow.closeTicket(active.id, note);
    if (!ok && flow.error) setError(flow.error);
    if (ok) await close(active.id, note).catch((e: unknown) => {
      setError(e instanceof ApiError ? e.message : String(e));
    });
  }

  const canClose = can("MAINTAINER", "SUPERVISOR");

  return (
    <section className="page-stack">
      <header className="page-title">
        <h1>隐患整改</h1>
        <p>整改单复验关闭后，离线端的旧巡检记录无法再覆盖现场，只会作为冲突项等待复核。</p>
      </header>

      {(error || flow.error) && <div className="alert alert-error">{error || flow.error}</div>}

      {rows.length === 0 ? <EmptyState title="暂无隐患整改单" /> : (
        <div className="hazard-grid">
          {rows.map((t) => (
            <article key={t.id} className="panel hazard-card">
              <header>
                <HazardSeverityTag value={t.severity} />
                <h2>整改单 #{t.id}</h2>
                <StatusBadge value={t.rectify_status} label={formatRectifyStatus(t.rectify_status)} />
              </header>
              <p className="muted">关联巡检结果 #{t.result_id} · 责任人 {t.owner_id} · 截止 {formatDay(t.deadline)}</p>
              <p>{t.rectify_note || "暂无整改说明"}</p>
              <TimelineList entries={[
                { key: "open", title: "隐患派单", at: t.deadline },
                ...(t.closed_at ? [{ key: "closed", title: "复验关闭：旧记录此后禁止覆盖现场", at: t.closed_at, tone: "ok" as const, desc: t.rectify_note }] : []),
              ]} />
              {canClose && t.rectify_status !== "CLOSED" && (
                <footer className="card-actions">
                  <button className="btn btn-primary" disabled={flow.closing}
                    onClick={() => { setActive(t); setNote(""); }}>
                    复验关闭
                  </button>
                </footer>
              )}
              {isAuditor && <p className="readonly-hint">审计员仅可查看</p>}
            </article>
          ))}
        </div>
      )}

      {active && (
        <div className="modal-mask" onClick={() => setActive(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>复验关闭整改单 #{active.id}</h2>
            <p className="muted">关闭后现场结论生效，离线旧记录只可经复核人工采用。</p>
            <textarea rows={4} placeholder="复验备注（必填）" value={note}
              onChange={(e) => setNote(e.target.value)} />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setActive(null)}>取消</button>
              <button className="btn btn-primary" disabled={flow.closing} onClick={handleClose}>
                {flow.closing ? "提交中…" : "确认关闭"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
