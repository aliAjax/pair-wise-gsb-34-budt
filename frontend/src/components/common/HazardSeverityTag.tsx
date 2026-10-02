import { formatSeverity } from "../../utils/formatters";

export function HazardSeverityTag({ value }: { value: string }) {
  const cls = String(value).toLowerCase();
  return <span className={`severity severity-${cls}`}>{formatSeverity(value)}</span>;
}
