import { StatusBadge } from "./StatusBadge";
import { formatRisk } from "../../utils/formatters";

export function HazardSeverityTag({ value, title }: { value: string; title?: string }) {
  return (
    <span className="severity-tag">
      {title ? <em>{title}</em> : null}
      <StatusBadge value={value} label={formatRisk(value)} />
    </span>
  );
}
