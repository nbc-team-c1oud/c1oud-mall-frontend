import type { ApiEnvelope } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const TOKEN_KEY = "c1oud.accessToken";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.append(k, String(v));
    }
  }
  return url.toString();
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  auth?: boolean;
  signal?: AbortSignal;
}

export async function api<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, auth = true, signal } = opts;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    throw new ApiError(
      "NET",
      e instanceof Error
        ? `네트워크 오류: ${e.message}`
        : "네트워크에 연결할 수 없습니다.",
      0,
    );
  }

  let envelope: ApiEnvelope<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      envelope = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      // body가 envelope이 아닐 수 있음 (예: 인프라 단의 500)
    }
  }

  if (!res.ok) {
    if (envelope) {
      throw new ApiError(envelope.code, envelope.message, res.status);
    }
    throw new ApiError("HTTP", `요청 실패 (${res.status})`, res.status);
  }

  // 204 No Content 또는 빈 본문은 정상 — undefined 반환
  if (res.status === 204 || !text) {
    return undefined as T;
  }

  if (!envelope) {
    throw new ApiError("PARSE", "응답을 해석할 수 없습니다.", res.status);
  }

  if (!envelope.success) {
    throw new ApiError(envelope.code, envelope.message, res.status);
  }

  return envelope.data as T;
}
