export interface Building {
  id: number;
  name: string;
  campus: string;
  floor_count: number;
  fire_grade: string;
  manager_id: number;
  address_code: string;
  compliance_rate?: number;
  qualified_devices?: number;
  rate_computed_at?: string;
  pending_reviews?: number;
}
