import { request } from "./http";
import type { AuditLogEntry } from "../types/AuditLog";

/** 仅审计员/主管可查看。 */
export async function listAuditLogs(): Promise<AuditLogEntry[]> {
  return request<AuditLogEntry[]>("/auth/audit-logs");
}
