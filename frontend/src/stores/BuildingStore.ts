import { create } from "zustand";
import { listBuilding, getBuildingOverview } from "../api/Building";
import type { Building } from "../types/Building";

type State = {
  rows: Building[];
  overview: Building[];
  loading: boolean;
  load: () => Promise<void>;
  loadOverview: () => Promise<void>;
};

export const useBuildingStore = create<State>((set) => ({
  rows: [],
  overview: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listBuilding(), loading: false });
  },
  async loadOverview() {
    set({ loading: true });
    set({ overview: await getBuildingOverview(), loading: false });
  },
}));
