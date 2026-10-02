import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { routes, DEFAULT_ROUTE } from "./router/routes";
import { useAuthStore } from "./api/auth";
import { useConnectivity } from "./hooks/useConnectivity";
import { useOfflineStore } from "./stores/OfflineStore";
import { UserRole, UserRoleText } from "./constants/UserRole";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { TasksPage } from "./pages/TasksPage";
import { HazardsPage } from "./pages/HazardsPage";
import { ReportsPage } from "./pages/ReportsPage";
import "./styles.css";

const DEMO_USERS: { id: number; role: UserRole }[] = [
  { id: 1, role: UserRole.INSPECTOR },
  { id: 3, role: UserRole.MAINTAINER },
  { id: 4, role: UserRole.SUPERVISOR },
  { id: 5, role: UserRole.AUDITOR },
];

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || DEFAULT_ROUTE;
}

function LoginBar() {
  const { user, login, logout } = useAuthStore();
  const online = useConnectivity();
  const queued = useOfflineStore((s) => s.queued);

  return (
    <div className="topbar">
      <div className={`net-state ${online ? "online" : "offline"}`}>
        <span className="dot" />
        {online ? `在线${queued.length ? `（待同步 ${queued.length}）` : ""}` : "离线：本机可继续填表"}
      </div>
      <div className="login-box">
        {user ? (
          <>
            <span className="user-chip">
              {user.name} · {UserRoleText[user.role]}
              {user.role === UserRole.AUDITOR && <em className="readonly-tag">只读</em>}
            </span>
            <button className="btn btn-ghost" onClick={logout}>退出</button>
          </>
        ) : (
          <label>
            演示登录：
            <select value="" onChange={(e) => e.target.value && void login(Number(e.target.value))}>
              <option value="">选择角色…</option>
              {DEMO_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {UserRoleText[u.role]}（用户 {u.id}）
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

function App() {
  const user = useAuthStore((s) => s.user);
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const onHash = () => setPath(currentPath());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const visibleRoutes = routes.filter(
    (r) => !user || r.roles.includes(user.role) || user.role === UserRole.AUDITOR,
  );
  const current = visibleRoutes.find((r) => r.route === path) ?? visibleRoutes[0] ?? routes[0];

  return (
    <div className="shell">
      <aside>
        <div className="brand">消防设施巡检维保平台</div>
        <nav>
          {visibleRoutes.map((route) => (
            <a key={route.route} href={`#${route.route}`}
              className={current.route === route.route ? "active" : ""}>
              {route.name}
            </a>
          ))}
        </nav>
        {user?.role === UserRole.AUDITOR && (
          <p className="nav-hint">审计员模式：全部页面只读，写操作由后端 403 拦截</p>
        )}
      </aside>
      <div className="content">
        <LoginBar />
        {current.route === "/dashboard" && <DashboardPage />}
        {current.route === "/devices" && <DevicesPage />}
        {current.route === "/tasks" && <TasksPage />}
        {current.route === "/hazards" && <HazardsPage />}
        {current.route === "/reports" && <ReportsPage />}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
