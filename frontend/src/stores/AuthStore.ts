import { create } from "zustand";
import { login as apiLogin } from "../api/Auth";
import { clearToken, getToken } from "../api/request";
import { READ_ONLY_ROLES } from "../constants/Role";
import type { AuthUser } from "../types/Auth";

interface AuthState {
  user: AuthUser | null;
  token: string;
  ready: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  isReadOnly: () => boolean;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: "",
  ready: false,

  async login(username, password) {
    const data = await apiLogin(username, password);
    set({ user: data.user, token: data.token, ready: true });
    return data.user;
  },

  logout() {
    clearToken();
    set({ user: null, token: "", ready: true });
  },

  isReadOnly() {
    const role = get().user?.role;
    return role ? READ_ONLY_ROLES.includes(role as never) : false;
  },

  hydrate() {
    const token = getToken();
    if (!token) {
      set({ ready: true });
      return;
    }
    // JWT payload carries the profile claims for route guards.
    try {
      const claims = JSON.parse(atob(token.split(".")[1]));
      set({
        token,
        ready: true,
        user: { id: Number(claims.sub), username: claims.sub, name: claims.name, role: claims.role }
      });
    } catch {
      clearToken();
      set({ ready: true });
    }
  }
}));
