import { request } from "./http";
import type { Building } from "../types/Building";

export async function listBuilding(): Promise<Building[]> {
  return request<Building[]>("/building");
}

/** 合规总览：compliance_rate 由后端在设备状态变更/复核裁决后重算。 */
export async function getBuildingOverview(): Promise<Building[]> {
  return request<Building[]>("/building/overview");
}
