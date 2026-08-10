import { getAccessToken } from '../lib/session';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = RequestInit & {
  /** Attach the current access token as a Bearer header. */
  auth?: boolean;
};

/**
 * Thin fetch wrapper. Deliberately does not implement refresh-on-401 yet —
 * that belongs in one place once the real login flow is wired up, so the
 * retry can't race with itself across concurrent callers.
 */
export async function request<T>(
  baseUrl: string,
  path: string,
  { auth = true, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const merged: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((headers as Record<string, string>) ?? {}),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) merged.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers: merged });

  if (!res.ok) {
    // auth-service returns a JSON problem body; fall back to the status text
    // when the response isn't JSON (proxy errors, connection resets).
    const body = await res.text();
    let message = res.statusText;
    try {
      message = (JSON.parse(body).message as string) ?? message;
    } catch {
      if (body) message = body;
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
