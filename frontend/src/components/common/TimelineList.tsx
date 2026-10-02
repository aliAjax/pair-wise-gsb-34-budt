import { formatDate } from "../../utils/formatters";

export interface TimelineEntry {
  key: string;
  title: string;
  at?: string | null;
  desc?: string;
  tone?: "muted" | "danger" | "ok";
}

/** 隐患整改与巡检任务共用的时间线。 */
export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <div className="empty">暂无动态</div>;
  }
  return (
    <ol className="timeline">
      {entries.map((e) => (
        <li key={e.key} className={e.tone ? `tone-${e.tone}` : ""}>
          <span className="timeline-title">{e.title}</span>
          {e.at && <time>{formatDate(e.at)}</time>}
          {e.desc && <p>{e.desc}</p>}
        </li>
      ))}
    </ol>
  );
}
