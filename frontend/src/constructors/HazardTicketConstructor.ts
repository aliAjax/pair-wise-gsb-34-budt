import type { HazardTicket } from "../types/HazardTicket";

export const createDefaultHazardTicket = (overrides: Partial<HazardTicket> = {}): HazardTicket => ({
  id: 1,
  result_id: 1,
  device_id: 1,
  severity: "HIGH",
  owner_id: 1,
  deadline: "",
  rectify_status: "OPEN",
  rectify_note: "",
  closed_at: "",
  version: 1,
  ...overrides
});

export const createHazardTicketForm = createDefaultHazardTicket;
export const createHazardTicketResponse = createDefaultHazardTicket;
