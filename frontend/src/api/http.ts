import { ERROR_MESSAGES } from "../constants/errorMessages";

/** 统一请求封装：所有接口走 /api 相对路径（nginx 反代），禁止硬编码 localhost。 */

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.message = message;
    this.status = status;
  }
}

function tokenHeader(): HeadersInit {
  const token = localStorage.getItem("fire_inspect_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", ...tokenHeader() },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) {
    return undefined as T;
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const code = payload?.code ?? "INTERNAL_ERROR";
    throw new ApiError(code, payload?.message ?? ERROR_MESSAGES.INTERNAL_ERROR, res.status);
  }
  return payload as T;
}

export const isOfflineError = (err: unknown) =>
  err instanceof TypeError && String((err as Error).message).toLowerCase().includes("fetch");
