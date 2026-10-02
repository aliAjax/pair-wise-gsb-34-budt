import { mockData } from "../mocks/seedData";
import type { HazardTicket } from "../types/HazardTicket";
import { request } from "./request";

const endpoint = "/api/hazard-ticket";

export async function listHazardTicket(): Promise<HazardTicket[]> {
  try {
    return await request<HazardTicket[]>(endpoint);
  } catch {
    return [...(mockData.hazardTicket as unknown as HazardTicket[])];
  }
}

export async function closeHazardTicket(ticketId: number, rectifyNote: string): Promise<HazardTicket> {
  return request<HazardTicket>(`${endpoint}/${ticketId}/close`, {
    method: "POST",
    body: JSON.stringify({ rectify_note: rectifyNote })
  });
}
