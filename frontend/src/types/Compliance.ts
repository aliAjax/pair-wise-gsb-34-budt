export interface DeviceCompliance {
  compliant: boolean;
  reason: "DEVICE_STATUS" | "MISSED" | "INSPECTED";
  result_id: number | null;
  detail: string;
}

export interface BuildingRate {
  building_id: number;
  building_name: string;
  campus: string;
  fire_grade: string;
  total_devices: number;
  compliant_devices: number;
  abnormal_devices: number;
  missed_devices: number;
  compliance_rate: number;
}
