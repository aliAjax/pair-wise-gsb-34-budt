import { create } from "zustand";
import { listInspectionResult } from "../api/InspectionResult";
import type { InspectionResult } from "../types/InspectionResult";

type State = {
  rows: InspectionResult[];
  loading: boolean;
  load: (deviceId?: number) => Promise<void>;
};

export const useInspectionResultStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load(deviceId) {
    set({ loading: true });
    set({ rows: await listInspectionResult(deviceId), loading: false });
  }
}));
