export type Role = "INSPECTOR" | "MAINTAINER" | "SUPERVISOR" | "AUDITOR";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
