const TONE: Record<string, string> = {
  NORMAL: "ok",
  MERGED: "ok",
  REVIEWED: "ok",
  CLOSED: "ok",
  RESOLVED: "ok",
  KEEP_SERVER: "ok",
  FAULT: "bad",
  FAILED: "bad",
  REJECTED: "bad",
  ABNORMAL: "bad",
  OVERDUE: "bad",
  CRITICAL: "bad",
  CONFLICT: "warn",
  PENDING: "warn",
  SUBMITTED: "warn",
  TAKE_CLIENT: "warn",
  IN_PROGRESS: "info",
  MAINTAINING: "info",
  PLANNED: "muted"
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const tone = TONE[value] ?? "muted";
  return (
    <span className={`badge badge-${tone}`} title={value}>
      {label ?? String(value).replace(/_/g, " ")}
    </span>
  );
}
