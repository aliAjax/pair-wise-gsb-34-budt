import { request } from "./request";

export interface AuditLogRow {
  id: number;
  entity: string;
  action: string;
  actor_id: number;
  actor_name: string;
  actor_role: string;
  message: string;
  created_at: string;
}

export async function listAuditLog(): Promise<AuditLogRow[]> {
  return request<AuditLogRow[]>("/api/audit-log");
}
