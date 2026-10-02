import { useAuthStore } from "../api/auth";
import { UserRole } from "../constants/UserRole";

/** 路由守卫与按钮显隐共用：审计员只读，写按钮一律隐藏/禁用。 */
export function useRbac() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  return {
    user,
    role,
    isInspector: role === UserRole.INSPECTOR,
    isMaintainer: role === UserRole.MAINTAINER,
    isSupervisor: role === UserRole.SUPERVISOR,
    isAuditor: role === UserRole.AUDITOR,
    can: (...roles: UserRole[]) => role !== undefined && roles.includes(role),
    canWrite: role !== undefined && role !== UserRole.AUDITOR,
  };
}
