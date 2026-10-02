import { useEffect } from "react";
import { useReviewQueue } from "../../hooks/useReviewQueue";
import { useAuthStore } from "../../stores/AuthStore";
import { ConflictReasonText } from "../../constants/SyncStatus";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { formatDate } from "../../utils/formatters";
import type { ReviewItem } from "../../types/Sync";

/**
 * 冲突复核面板——设备台账页与合规总览页共用同一组件、同一份 store 复核结果。
 * 审计员只读（不显示处置按钮）；仅物业主管可保留现场/采用巡检员记录。
 */
export function ReviewConflictPanel({
  scope,
  compact = false
}: {
  scope?: { buildingId?: number };
  compact?: boolean;
}) {
  const { pendingReviews, reviews, loadReviews, keepServer, takeClient, lastMessage } = useReviewQueue();
  const user = useAuthStore((s) => s.user);
  const isSupervisor = user?.role === "SUPERVISOR";

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const scopedPending = scope?.buildingId
    ? pendingReviews.filter((r) => r.building_id === scope.buildingId)
    : pendingReviews;
  const scopedAll = scope?.buildingId
    ? reviews.filter((r) => r.building_id === scope.buildingId)
    : reviews;

  const renderReview = (review: ReviewItem) => (
    <article key={review.id} className="conflict-card">
      <header>
        <div>
          <strong>冲突 #{review.id}</strong>
          <span className="conflict-reason">{ConflictReasonText[review.reason] ?? review.reason}</span>
        </div>
        <StatusBadge value={review.status === "PENDING" ? "CONFLICT" : review.status} />
      </header>
      <dl>
        <div><dt>设备</dt><dd>#{review.device_id}（{review.item_code}）</dd></div>
        <div><dt>巡检员判定</dt><dd>{review.result_status === "NORMAL" ? "正常" : "异常"} · {review.measured_value || "—"}</dd></div>
        <div><dt>采集时间</dt><dd>{formatDate(review.captured_at)}</dd></div>
        <div><dt>提交人</dt><dd>{review.submitted_by_name}</dd></div>
        {review.server_snapshot.server_result ? (
          <div><dt>现场最新结果</dt>
            <dd>{review.server_snapshot.server_result.result_status} · {review.server_snapshot.server_result.measured_value}（{formatDate(review.server_snapshot.server_result.captured_at)}）</dd>
          </div>
        ) : null}
        {review.server_snapshot.closed_ticket ? (
          <div><dt>已关闭整改单</dt>
            <dd>#{review.server_snapshot.closed_ticket.id} {review.server_snapshot.closed_ticket.rectify_note}（{formatDate(review.server_snapshot.closed_ticket.closed_at)} 关闭）</dd>
          </div>
        ) : null}
      </dl>
      {review.note ? <p className="conflict-note">巡检备注：{review.note}</p> : null}
      {isSupervisor && review.status === "PENDING" ? (
        <footer>
          <button className="btn btn-ghost" onClick={() => void keepServer(review.id)}>保留现场</button>
          <button className="btn btn-primary" onClick={() => void takeClient(review.id)}>采用巡检员记录</button>
        </footer>
      ) : (
        <footer className="readonly-hint">
          {review.status === "PENDING" ? "仅物业主管可处置，当前为只读视图" : `已处置：${review.status}`}
        </footer>
      )}
    </article>
  );

  return (
    <section className={`panel review-panel ${compact ? "compact" : ""}`}>
      <h2>冲突复核（{scopedPending.length} 项待处理）</h2>
      {lastMessage ? <p className="inline-hint">{lastMessage}</p> : null}
      {scopedPending.length === 0 ? (
        <EmptyState title="暂无待复核冲突；设备台账与合规总览共用这一份复核结果" />
      ) : (
        <div className="conflict-grid">{scopedPending.map(renderReview)}</div>
      )}
      {!compact && scopedAll.some((r) => r.status !== "PENDING") ? (
        <details className="resolved-history">
          <summary>已处置记录（{scopedAll.filter((r) => r.status !== "PENDING").length}）</summary>
          <div className="conflict-grid">{scopedAll.filter((r) => r.status !== "PENDING").map(renderReview)}</div>
        </details>
      ) : null}
    </section>
  );
}
