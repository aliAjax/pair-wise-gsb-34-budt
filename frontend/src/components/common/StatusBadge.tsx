import { formatStatus } from "../../utils/formatters";

/** 设备/巡检/整改状态共用徽标，class 与后端枚举值保持一致便于配色。 */
export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`badge badge-${String(value).toLowerCase().replace(/_/g, "-")}`}>
      {label ?? formatStatus(value)}
    </span>
  );
}
