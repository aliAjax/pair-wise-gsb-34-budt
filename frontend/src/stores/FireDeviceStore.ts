import { create } from "zustand";
import { listFireDevice, updateDeviceStatus } from "../api/FireDevice";
import type { FireDevice } from "../types/FireDevice";

type State = {
  rows: FireDevice[];
  loading: boolean;
  load: (buildingId?: number) => Promise<void>;
  changeStatus: (
    deviceId: number,
    status: string,
    expectedVersion?: number,
    note?: string,
  ) => Promise<void>;
};

export const useFireDeviceStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load(buildingId) {
    set({ loading: true });
    set({ rows: await listFireDevice(buildingId), loading: false });
  },
  async changeStatus(deviceId, status, expectedVersion, note) {
    await updateDeviceStatus(deviceId, status, expectedVersion, note);
    // 主管更新后后端已失效旧结果并重算达标率，前端刷新台账
    set({ rows: get().rows.map((d) => (d.id === deviceId ? { ...d, status } : d)) });
  },
}));
