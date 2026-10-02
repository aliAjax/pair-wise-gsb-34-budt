import { create } from "zustand";
import {
  listInspectionTask,
  claimInspectionTask,
  reviewInspectionTask,
} from "../api/InspectionTask";
import type { InspectionTask } from "../types/InspectionTask";

type State = {
  rows: InspectionTask[];
  loading: boolean;
  load: (buildingId?: number) => Promise<void>;
  claim: (taskId: number) => Promise<void>;
  review: (taskId: number, approved: boolean) => Promise<void>;
};

export const useInspectionTaskStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load(buildingId) {
    set({ loading: true });
    set({ rows: await listInspectionTask(buildingId), loading: false });
  },
  async claim(taskId) {
    await claimInspectionTask(taskId);
    await get().load();
  },
  async review(taskId, approved) {
    await reviewInspectionTask(taskId, approved);
    await get().load();
  },
}));
