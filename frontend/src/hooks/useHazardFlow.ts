import { useHazardTicketStore } from "../stores/HazardTicketStore";

/** 隐患整改进度：开放/关闭统计与复验关闭动作。 */
export function useHazardFlow() {
  const rows = useHazardTicketStore((s) => s.rows);
  const close = useHazardTicketStore((s) => s.close);
  const open = rows.filter((t) => t.rectify_status !== "CLOSED");
  const closed = rows.filter((t) => t.rectify_status === "CLOSED");
  return { rows, open, closed, closeTicket: close };
}
