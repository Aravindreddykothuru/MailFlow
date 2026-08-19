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
 * Single network entry point. Every service function goes through here.
 * Includes automated fallback between standard and /api/ prefixes.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!config.apiBaseUrl) {
    throw new ApiError({
      code: 'API_NOT_CONFIGURED',
      message: 'Backend URL is not configured. Running in sandbox mode.'
    });
  }

  const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
  const targetUrl = `${baseUrl}${path}`;

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      method: options.method ?? 'GET',
      signal: options.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    // If 404 on standard path, automatically try /api prefix fallback
    if (response.status === 404 && !path.startsWith('/api') && !path.includes('.')) {
      try {
        const fallbackRes = await fetch(`${baseUrl}/api${path}`, {
          method: options.method ?? 'GET',
          signal: options.signal,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
        if (fallbackRes.ok || fallbackRes.status === 401 || fallbackRes.status === 400 || fallbackRes.status === 409) {
          response = fallbackRes;
        }
      } catch {
        // Keep original response
      }
    }
  } catch (err) {
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: `Could not connect to backend at ${baseUrl}. Please check that your backend is running.`
    });
  }

  if (response.status === 401) {
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