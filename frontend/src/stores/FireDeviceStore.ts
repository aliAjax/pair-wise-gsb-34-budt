import { create } from "zustand";
import { listFireDevice, updateFireDeviceStatus } from "../api/FireDevice";
import type { FireDevice } from "../types/FireDevice";

type State = {
  rows: FireDevice[];
  loading: boolean;
  load: () => Promise<void>;
  updateStatus: (deviceId: number, status: string) => Promise<void>;
};

export const useFireDeviceStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listFireDevice(), loading: false });
  },
  async updateStatus(deviceId, status) {
    await updateFireDeviceStatus(deviceId, status);
    set({ rows: await listFireDevice() });
  }
}));
