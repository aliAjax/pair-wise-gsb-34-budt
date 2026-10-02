import { useEffect, useState } from "react";
import { ApiError } from "../api/request";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { HazardSeverityTag } from "../components/common/HazardSeverityTag";
import { TimelineList } from "../components/common/TimelineList";
import { useHazardFlow } from "../hooks/useHazardFlow";
import { useAuthStore as useAuth } from "../stores/AuthStore";
import { useHazardTicketStore } from "../stores/HazardTicketStore";
import { formatDate } from "../utils/formatters";

export function HazardsPage() {
  const { rows, open, closed, closeTicket } = useHazardFlow();
  const load = useHazardTicketStore((s) => s.load);
  const user = useAuth((s) => s.user);
  const canClose = user?.role === "SUPERVISOR" || user?.role === "MAINTAINER";
  const [note, setNote] = useState("复验通过，设备恢复正常");
  const [message, setMessage] = useState("");

  useEffect(() => { void load(); }, [load]);

  const close = async (id: number) => {
    setMessage("");
    try {
      await closeTicket(id, note);
      setMessage(`隐患单 #${id} 已复验关闭；关闭后旧异常记录将无法覆盖现场，只进冲突复核`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "关闭失败");
    }
  };

  const entries = [...rows].reverse().map((t) => ({
    id: t.id,
    title: `隐患单 #${t.id}（设备 #${t.device_id}）${t.rectify_status === "CLOSED" ? "已复验关闭" : "整改中"}`,
    time: t.rectify_status === "CLOSED" ? t.closed_at : t.deadline,
    tone: t.rectify_status === "CLOSED" ? "ok" : "warn",
    meta: t.rectify_note
  }));

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">hazard tickets</p>
          <h1>隐患整改</h1>
        </div>
        <StatusBadge value={canClose ? "IN_PROGRESS" : "REVIEWED"} label={canClose ? "可复验关闭" : "只读视图"} />
      </section>

      <section className="metrics">
        <StatCard label="整改中" value={open.length} tone={open.length ? "warn" : "good"} />
        <StatCard label="已关闭" value={closed.length} tone="good" />
        <StatCard label="全部隐患单" value={rows.length} />
      </section>

      <section className="workbench">
        <div className="panel wide">
          <h2>整改单列表</h2>
          {message ? <p className="inline-hint">{message}</p> : null}
          <div className="table">
            {rows.map((t) => (
              <article key={t.id} className="row hazard-row">
                <strong>#{t.id} · 设备 #{t.device_id}</strong>
                <HazardSeverityTag value={t.severity} />
                <StatusBadge value={t.rectify_status} label={t.rectify_status === "CLOSED" ? "已关闭" : "整改中"} />
                <span className="muted">期限 {t.deadline}{t.closed_at ? ` · 关闭 ${formatDate(t.closed_at)}` : ""}</span>
                <span className="muted">{t.rectify_note}</span>
                {t.rectify_status !== "CLOSED" && canClose ? (
                  <button className="btn btn-primary" onClick={() => void close(t.id)}>复验关闭</button>
                ) : null}
              </article>
            ))}
          </div>
          {canClose ? (
            <div className="inline-form">
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          ) : null}
        </div>
        <div className="panel">
          <h2>整改时间线</h2>
          <TimelineList entries={entries} />
        </div>
      </section>
    </main>
  );
}
