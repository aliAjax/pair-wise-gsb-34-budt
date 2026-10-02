import type { HazardTicket } from "../types/HazardTicket";

export const createDefaultHazardTicket = (overrides: Partial<HazardTicket> = {}): HazardTicket => ({
  id: 0,
  result_id: 1,
  severity: "MEDIUM",
  owner_id: 3,
  deadline: "",
  rectify_status: "OPEN",
  rectify_note: "",
  closed_at: null,
  ...overrides,
});

export const createHazardTicketForm = createDefaultHazardTicket;
export const createHazardTicketResponse = createDefaultHazardTicket;
