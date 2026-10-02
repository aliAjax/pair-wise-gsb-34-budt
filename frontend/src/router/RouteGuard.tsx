import type { ReactNode } from "react";
import { Navigate } from "../router/navigation";
import { routes, canAccess, type AppRoute } from "./routes";
import { useAuthStore } from "../stores/AuthStore";
import { RoleText } from "../constants/Role";
import { useSyncStore } from "../stores/SyncStore";

/** 路由守卫：未登录跳登录；审计员保留导航但所有写按钮隐藏、写接口被后端拒绝。 */
export function RouteGuard({ route, children }: { route: AppRoute; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" />;
  if (!canAccess(route, user.role)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export function NavShell({
  active,
  onNavigate,
  children
}: {
  active: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const offlineCount = useSyncStore((s) => s.offlineCount);
  const online = useSyncStore((s) => s.online);

  return (
    <div className="shell">
      <aside>
        <div className="brand">消防设施巡检维保平台</div>
        <nav>
          {routes.filter((r) => canAccess(r, user?.role)).map((route) => (
            <button key={route.route} className={active === route.route ? "active" : ""}
              onClick={() => onNavigate(route.route)}>
              {route.name}
            </button>
          ))}
        </nav>
        <div className="user-box">
          <p>{user?.name} · {user ? RoleText[user.role] : ""}</p>
          <p className={`net-line ${online ? "is-online" : "is-offline"}`}>
            {online ? "网络正常" : "地下室断网中"}{offlineCount ? `（待同步 ${offlineCount}）` : ""}
          </p>
          <button className="logout-btn" onClick={() => { logout(); onNavigate("/login"); }}>退出登录</button>
        </div>
      </aside>
      {children}
    </div>
  );
}
