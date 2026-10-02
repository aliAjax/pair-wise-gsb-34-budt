export const Role = ["INSPECTOR", "MAINTAINER", "SUPERVISOR", "AUDITOR"] as const;
export type Role = (typeof Role)[number];

export const RoleText: Record<Role, string> = {
  INSPECTOR: "巡检员",
  MAINTAINER: "维保商",
  SUPERVISOR: "物业主管",
  AUDITOR: "审计员",
};

export const READ_ONLY_ROLES: Role[] = ["AUDITOR"];
