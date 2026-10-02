export interface InspectionResult {
  id: number;
  task_id: number;
  device_id: number;
  item_code: string;
  result_status: string;
  measured_value: string;
  photo_url: string;
  note: string;
  effective: boolean;
  version: number;
  captured_at: string;
  reviewed_at?: string | null;
  hazard_ticket_id?: number | null;
}
