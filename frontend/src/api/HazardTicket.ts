import { request } from "./http";
import type { HazardTicket } from "../types/HazardTicket";

export async function listHazardTicket(status?: string): Promise<HazardTicket[]> {
  const query = status ? `?status=${status}` : "";
  return request<HazardTicket[]>(`/hazard-ticket${query}`);
}

/** 维保商/主管复验关闭；关闭后离线旧记录不得再覆盖现场。 */
export async function closeHazardTicket(
  ticketId: number,
  rectifyNote: string,
): Promise<HazardTicket> {
  return request<HazardTicket>(`/hazard-ticket/${ticketId}/close`, {
    method: "POST",
    body: { rectify_note: rectifyNote },
  });
}
