import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { ErrorCode } from "../constants/errorCodes";

const TOKEN_KEY = "fire-inspect-token";

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  code: ErrorCode | "NETWORK_ERROR";
  status: number;

  constructor(code: ErrorCode | "NETWORK_ERROR", status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers ?? {})
      }
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", 0, "网络不可用，请检查地下室网络后重试（离线结果已保留在本机）");
  }

  if (res.ok) {
    return (await res.json()) as T;
  }

  let code: ErrorCode = "INTERNAL_ERROR";
  let message = ERROR_MESSAGES.INTERNAL_ERROR;
  try {
    const body = await res.json();
    code = (body.code as ErrorCode) ?? code;
    message = code === "RBAC_DENIED" || code === "PROXY_FORBIDDEN"
      ? ERROR_MESSAGES[code]
      : (ERROR_MESSAGES[code] ?? body.message ?? message);
  } catch {
    /* keep defaults */
  }
  throw new ApiError(code, res.status, message);
}
