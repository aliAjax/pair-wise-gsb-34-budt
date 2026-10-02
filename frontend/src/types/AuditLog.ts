export interface AuditLogEntry {
  id: number;
  actor: string;
  actor_id: number | null;
  action: string;
  target_type: string;
  target_id: string;
  message: string;
  created_at: string;
}
