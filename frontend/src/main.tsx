import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { NavShell, RouteGuard } from "./router/RouteGuard";
import { routes } from "./router/routes";
import { useAuthStore } from "./stores/AuthStore";
import { useHazardTicketStore } from "./stores/HazardTicketStore";
import { useSyncStore } from "./stores/SyncStore";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { TasksPage } from "./pages/TasksPage";
import { HazardsPage } from "./pages/HazardsPage";
import { ReportsPage } from "./pages/ReportsPage";
import "./styles.css";

const PAGE_MAP: Record<string, () => JSX.Element> = {
  "/dashboard": DashboardPage,
  "/devices": DevicesPage,
  "/tasks": TasksPage,
  "/hazards": HazardsPage,
  "/reports": ReportsPage
};

function App() {
  const [path, setPath] = useState<string>("/dashboard");
  const { user, ready, hydrate } = useAuthStore();
  const loadTickets = useHazardTicketStore((s) => s.load);
  const loadBatches = useSyncStore((s) => s.loadBatches);
  const loadReviews = useSyncStore((s) => s.loadReviews);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onNavigate = (e: Event) => setPath((e as CustomEvent<string>).detail);
    window.addEventListener("navigate", onNavigate);
    return () => window.removeEventListener("navigate", onNavigate);
  }, []);

  useEffect(() => {
    if (user) {
      void loadTickets();
      void loadBatches();
      void loadReviews();
    }
  }, [user, loadTickets, loadBatches, loadReviews]);

  if (!ready) return null;
  if (!user || path === "/login") {
    if (user && path === "/login") {
      // already logged in, fall through to dashboard
    } else {
      return <LoginPage />;
    }
  }

  const route = routes.find((r) => r.route === path) ?? routes[0];
  const Page = PAGE_MAP[route.route] ?? DashboardPage;

  return (
    <NavShell active={route.route} onNavigate={setPath}>
      <RouteGuard route={route} key={route.route}>
        <Page />
      </RouteGuard>
    </NavShell>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
