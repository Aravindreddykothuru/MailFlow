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
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (!response.ok) {
    throw new ApiError({
      code: 'REQUEST_FAILED',
      status: response.status,
      message: `Request to ${path} failed with status ${response.status}.`
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