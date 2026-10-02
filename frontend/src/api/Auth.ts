import type { LoginResponse } from "../types/Auth";
import { request, setToken } from "./request";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  setToken(data.token);
  return data;
}
