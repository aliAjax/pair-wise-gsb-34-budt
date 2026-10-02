import { create } from "zustand";
import { listHazardTicket, closeHazardTicket } from "../api/HazardTicket";
import type { HazardTicket } from "../types/HazardTicket";

type State = {
  rows: HazardTicket[];
  loading: boolean;
  load: (status?: string) => Promise<void>;
  close: (ticketId: number, note: string) => Promise<void>;
};

export const useHazardTicketStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load(status) {
    set({ loading: true });
    set({ rows: await listHazardTicket(status), loading: false });
  },
  async close(ticketId, note) {
    await closeHazardTicket(ticketId, note);
    await get().load();
  },
}));
