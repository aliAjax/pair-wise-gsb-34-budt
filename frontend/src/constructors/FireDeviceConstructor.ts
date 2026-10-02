import type { FireDevice } from "../types/FireDevice";

export const createDefaultFireDevice = (overrides: Partial<FireDevice> = {}): FireDevice => ({
  id: 1,
  building_id: 1,
  device_code: "MH-101",
  device_type: "HYDRANT",
  floor: "1F",
  location_desc: "默认位置",
  install_date: "2024-01-01",
  status: "NORMAL",
  next_maintenance_at: "",
  version: 1,
  updated_at: "",
  ...overrides
});

export const createFireDeviceForm = createDefaultFireDevice;
export const createFireDeviceResponse = createDefaultFireDevice;
