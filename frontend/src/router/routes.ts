import type { Role } from "../constants/Role";

export interface AppRoute {
  name: string;
  route: string;
  roles: Role[] | "*";
}

export const routes: AppRoute[] = [
  { name: "消防合规总览", route: "/dashboard", roles: "*" },
  { name: "消防设备台账", route: "/devices", roles: "*" },
  { name: "巡检任务", route: "/tasks", roles: ["INSPECTOR", "SUPERVISOR", "AUDITOR"] },
  { name: "隐患整改", route: "/hazards", roles: ["MAINTAINER", "SUPERVISOR", "AUDITOR"] },
  { name: "合规报表", route: "/reports", roles: "*" }
];

export function canAccess(route: AppRoute, role?: Role): boolean {
  if (route.roles === "*") return true;
  return role ? route.roles.includes(role) : false;
}
