import { create } from "zustand";
import type { AuthUser } from "../types/Auth";
import { request } from "./http";
import { UserRole } from "../constants/UserRole";

const TOKEN_KEY = "fire_inspect_token";
const USER_KEY = "fire_inspect_user";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  login: (userId: number) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  isAuditor: () => boolean;
};

function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadUser(),
  token: localStorage.getItem(TOKEN_KEY),
  async login(userId) {
    const data = await request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: { user_id: userId },
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
  hasRole(...roles) {
    const role = get().user?.role;
    return role !== undefined && roles.includes(role);
  },
  isAuditor() {
    return get().user?.role === UserRole.AUDITOR;
  },
}));
