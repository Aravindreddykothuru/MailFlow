import { config } from '../lib/config';
import { ApiError } from '../types/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

let authToken: string | null = null;

/** Set once after authentication so every request carries the session token. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Single network entry point. Every service function goes through here, so
 * swapping the transport (fetch → Next.js server action, tRPC, …) is a
 * one-file change.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!config.apiBaseUrl) {
    throw new ApiError({
      code: 'API_NOT_CONFIGURED',
      message: 'No API base URL configured.'
    });
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    signal: options.signal,
    // Required for httpOnly cookie-based auth to work cross-origin.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 401) {
    // Only dispatch auth:expired on authenticated action routes (not on initial /auth/me checks or login form)
    if (path !== '/auth/me' && path !== '/me' && path !== '/auth/login' && path !== '/auth/register') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    let errorData: { error?: { code?: string; message?: string } } = {};
    try { errorData = await response.json(); } catch { /* non-JSON */ }
    throw new ApiError({
      code: errorData.error?.code ?? 'UNAUTHENTICATED',
      status: 401,
      message: errorData.error?.message ?? (path === '/auth/login' ? 'Invalid email or password.' : 'Please sign in to continue.')
    });
  }


  if (!response.ok) {
    // Try to parse a structured error from the backend first.
    let errorData: { error?: { code?: string; message?: string } } = {};
    try { errorData = await response.json(); } catch { /* non-JSON body */ }
    throw new ApiError({
      code: errorData.error?.code ?? 'REQUEST_FAILED',
      status: response.status,
      message: errorData.error?.message ?? `Request to ${path} failed with status ${response.status}.`
    });
  }

  return (await response.json()) as T;
}

/** Simulated latency so prototype screens exercise their real loading states. */
export function prototypeDelay(ms = 700): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}