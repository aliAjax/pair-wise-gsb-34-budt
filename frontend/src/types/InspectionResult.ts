export interface InspectionResult {
  id: number;
  task_id: number;
  device_id: number;
  item_code: string;
  result_status: string;
  measured_value: string;
  photo_url: string;
  note: string;
  recorded_at: string;
  source: "OFFLINE" | "ONLINE" | "REVIEW_OVERRIDE" | string;
  valid: boolean;
  invalid_reason?: string | null;
  client_uuid?: string | null;
}
