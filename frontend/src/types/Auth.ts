import type { UserRole } from "../constants/UserRole";

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
