import { mockData } from "../mocks/seedData";
import type { Building } from "../types/Building";
import type { BuildingRate } from "../types/Compliance";
import { request } from "./request";

const endpoint = "/api/building";

export async function listBuilding(): Promise<Building[]> {
  try {
    return await request<Building[]>(endpoint);
  } catch {
    return [...(mockData.building as unknown as Building[])];
  }
}

export async function getBuildingOverview(): Promise<BuildingRate[]> {
  return request<BuildingRate[]>(`${endpoint}/overview`);
}

export async function saveBuilding(payload: Building) {
  console.info("save Building", payload);
  return payload;
}
