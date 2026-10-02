import { UserRole } from "../constants/UserRole";

/** 路由元信息：auditorAllowed 之外的守卫在组件中按按钮粒度二次控制。 */
export interface RouteMeta {
  name: string;
  route: string;
  /** 哪些角色默认可见（审计员所有页面可见但只读） */
  roles: UserRole[];
}

export const routes: RouteMeta[] = [
  { name: "消防合规总览", route: "/dashboard", roles: [UserRole.SUPERVISOR, UserRole.AUDITOR, UserRole.INSPECTOR, UserRole.MAINTAINER] },
  { name: "消防设备台账", route: "/devices", roles: [UserRole.SUPERVISOR, UserRole.AUDITOR, UserRole.INSPECTOR, UserRole.MAINTAINER] },
  { name: "巡检任务", route: "/tasks", roles: [UserRole.INSPECTOR, UserRole.SUPERVISOR, UserRole.AUDITOR] },
  { name: "隐患整改", route: "/hazards", roles: [UserRole.MAINTAINER, UserRole.SUPERVISOR, UserRole.AUDITOR] },
  { name: "合规报表", route: "/reports", roles: [UserRole.SUPERVISOR, UserRole.AUDITOR] },
];

export const DEFAULT_ROUTE = "/dashboard";
