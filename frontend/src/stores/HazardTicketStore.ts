import { create } from "zustand";
import { closeHazardTicket, listHazardTicket } from "../api/HazardTicket";
import type { HazardTicket } from "../types/HazardTicket";

type State = {
  rows: HazardTicket[];
  loading: boolean;
  load: () => Promise<void>;
  close: (ticketId: number, note: string) => Promise<void>;
};

export const useHazardTicketStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listHazardTicket(), loading: false });
  },
  async close(ticketId, note) {
    await closeHazardTicket(ticketId, note);
    set({ rows: await listHazardTicket() });
  }
}));
