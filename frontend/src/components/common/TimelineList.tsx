import { formatDate } from "../../utils/formatters";

export interface TimelineEntry {
  id: number | string;
  title: string;
  time: string;
  tone?: string;
  meta?: string;
}

export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <div className="empty">暂无动态</div>;
  return (
    <ol className="timeline">
      {entries.map((entry) => (
        <li key={entry.id} className={entry.tone ? `tone-${entry.tone}` : ""}>
          <div className="timeline-dot" />
          <div>
            <p>{entry.title}</p>
            <time>{formatDate(entry.time)}</time>
            {entry.meta ? <em>{entry.meta}</em> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
