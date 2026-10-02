import { create } from "zustand";
import { listInspectionResult } from "../api/InspectionResult";
import type { InspectionResult } from "../types/InspectionResult";

type State = {
  rows: InspectionResult[];
  loading: boolean;
  load: (taskId?: number, deviceId?: number) => Promise<void>;
};

export const useInspectionResultStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load(taskId, deviceId) {
    set({ loading: true });
    set({ rows: await listInspectionResult(taskId, deviceId), loading: false });
  },
}));
