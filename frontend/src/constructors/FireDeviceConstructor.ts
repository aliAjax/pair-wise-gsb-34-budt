import type { FireDevice } from "../types/FireDevice";

export const createDefaultFireDevice = (overrides: Partial<FireDevice> = {}): FireDevice => ({
  id: 0,
  building_id: 1,
  device_code: "",
  device_type: "EXTINGUISHER",
  floor: "1F",
  location_desc: "",
  install_date: "",
  status: "NORMAL",
  next_maintenance_at: "",
  status_changed_at: null,
  row_version: 1,
  ...overrides,
});

export const createFireDeviceForm = createDefaultFireDevice;
export const createFireDeviceResponse = createDefaultFireDevice;
