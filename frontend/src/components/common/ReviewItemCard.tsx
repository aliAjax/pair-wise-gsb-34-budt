import { ConflictTypeText, ReviewResolutionText } from "../../constants/Review";
import { formatReviewKind } from "../../utils/formatters";
import type { ReviewItem } from "../../types/ReviewItem";

interface ReviewItemCardProps {
  item: ReviewItem;
  onResolve?: (item: ReviewItem, resolution: "CONFIRMED" | "OVERRIDDEN") => void;
  readonly?: boolean;
}

/**
 * 复核项卡片：设备台账页与消防合规总览页共用。
 * CONFIRMED = 维持服务端现场；OVERRIDDEN = 人工采用本机/历史记录。
 */
export function ReviewItemCard({ item, onResolve, readonly = false }: ReviewItemCardProps) {
  const pending = item.resolution === "PENDING";
  return (
    <article className={`review-card ${pending ? "pending" : "resolved"}`}>
      <header>
        <span className="review-kind">{formatReviewKind(item.kind)}</span>
        <span className="review-conflict">{ConflictTypeText[item.conflict_type] ?? item.conflict_type}</span>
        <span className={`resolution res-${String(item.resolution).toLowerCase()}`}>
          {ReviewResolutionText[item.resolution as keyof typeof ReviewResolutionText] ?? item.resolution}
        </span>
      </header>
      <p className="review-ref">
        关联 {item.ref_type}#{item.ref_id}
        {item.device_id ? ` · 设备#${item.device_id}` : ""}
        {item.batch_id ? ` · 批次 ${item.batch_id}` : ""}
      </p>
      {item.server_snapshot && (
        <pre className="review-snapshot">现场：{JSON.stringify(item.server_snapshot)}</pre>
      )}
      {item.client_payload && (
        <pre className="review-snapshot client">本机：{JSON.stringify(item.client_payload)}</pre>
      )}
      {item.review_note && <p className="review-note">复核备注：{item.review_note}</p>}
      {pending && !readonly && onResolve && (
        <footer>
          <button className="btn" onClick={() => onResolve(item, "CONFIRMED")}>维持现场</button>
          <button className="btn btn-primary" onClick={() => onResolve(item, "OVERRIDDEN")}>
            人工采用
          </button>
        </footer>
      )}
    </article>
  );
}
