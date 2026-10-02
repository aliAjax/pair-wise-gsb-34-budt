import type { Building } from "../types/Building";

export const createDefaultBuilding = (overrides: Partial<Building> = {}): Building => ({
  id: 0,
  name: "",
  campus: "",
  floor_count: 1,
  fire_grade: "一级",
  manager_id: 4,
  address_code: "",
  compliance_rate: 0,
  qualified_devices: 0,
  ...overrides,
});

export const createBuildingForm = createDefaultBuilding;
export const createBuildingResponse = createDefaultBuilding;
