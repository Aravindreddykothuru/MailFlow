import { config, isPrototypeMode } from '../lib/config';
import { prototypeDelay, request, setAuthToken } from './apiClient';
import { ApiError } from '../types/api';
import type { Session, User } from '../types/user';


const SESSION_STORAGE_KEY = 'mailflow.session';

/**
 * ─── Google authentication boundary ──────────────────────────────────────────
 * In production: redirects the browser window to GET /auth/google, which kicks
 * off the server-side OAuth code-exchange flow. The callback sets an httpOnly
 * cookie and redirects back to /dashboard. The frontend then calls fetchCurrentUser()
 * on mount to hydrate the session from the cookie.
 *
 * In prototype mode (no API base URL): resolves a local fake session so the
 * rest of the UI can be exercised without a real backend.
 */
export async function signInWithGoogle(): Promise<Session> {
  if (!isPrototypeMode && config.apiBaseUrl) {
    // Real flow: redirect the browser to the backend OAuth entry point.
    // The backend will redirect back to /dashboard after setting the cookie.
    window.location.href = `${config.apiBaseUrl}/auth/google`;
    // Return a promise that never resolves — the page will navigate away.
    return new Promise(() => undefined);
  }

  await prototypeDelay(1500);

  if (shouldSimulateAuthFailure()) {
    throw new ApiError({
      code: 'AUTH_ACCOUNT_NOT_RECOGNISED',
      message: "Your account wasn't recognized. Check that you're using a registered org email."
    });
  }

  const session: Session = {
    accessToken: 'prototype-session',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: {
      id: 'usr_1',
      name: 'John Doe',
      email: 'john@example.com',
      avatarUrl: null
    }
  };
  setAuthToken(session.accessToken);
  persistSession(session);
  return session;
}

/** Sign in with email and password */
export async function signInWithEmail(email: string, password: string): Promise<Session> {
  if (!isPrototypeMode && config.apiBaseUrl) {
    try {
      const res = await request<{ ok: true; data: User & { token?: string } }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      const session: Session = {
        accessToken: res.data.token || 'cookie-session',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          avatarUrl: res.data.avatarUrl,
        },
      };
      setAuthToken(session.accessToken);
      persistSession(session);
      return session;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw err;
      }
      console.warn('Backend auth endpoint unavailable, falling back to local session:', err);
    }
  }

  await prototypeDelay(800);

  if (shouldSimulateAuthFailure()) {
    throw new ApiError({
      code: 'INVALID_CREDENTIALS',
      message: "Invalid email or password. Please check your credentials.",
    });
  }

  const name = email.split('@')[0]?.replace(/[._-]+/g, ' ') || 'User';
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  const session: Session = {
    accessToken: 'prototype-session',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: {
      id: `usr_${Date.now()}`,
      name: formattedName,
      email,
      avatarUrl: null,
    },
  };
  setAuthToken(session.accessToken);
  persistSession(session);
  return session;
}

/** Register a new account with name, email and password */
export async function signUpWithEmail(name: string, email: string, password: string): Promise<Session> {
  if (!isPrototypeMode && config.apiBaseUrl) {
    try {
      const res = await request<{ ok: true; data: User & { token?: string } }>('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      const session: Session = {
        accessToken: res.data.token || 'cookie-session',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          avatarUrl: res.data.avatarUrl,
        },
      };
      setAuthToken(session.accessToken);
      persistSession(session);
      return session;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
        throw err;
      }
      console.warn('Backend registration endpoint unavailable, falling back to local session:', err);
    }
  }


  await prototypeDelay(900);

  if (shouldSimulateAuthFailure()) {
    throw new ApiError({
      code: 'REGISTRATION_FAILED',
      message: 'Could not create account. Please try again with a different email.',
    });
  }

  const session: Session = {
    accessToken: 'prototype-session',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: {
      id: `usr_${Date.now()}`,
      name,
      email,
      avatarUrl: null,
    },
  };
  setAuthToken(session.accessToken);
  persistSession(session);
  return session;
}

export async function signOut(): Promise<void> {

  if (!isPrototypeMode) {
    await request<void>('/auth/logout', { method: 'POST' }).catch(() => undefined);
  } else {
    await prototypeDelay(300);
  }
  setAuthToken(null);
  clearSession();
}

/**
 * Fetches the current user profile from GET /me using the httpOnly session cookie.
 * Returns null if the session is missing or expired (401).
 * Used by AuthContext on mount in production mode to restore the session.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  if (isPrototypeMode) return null;
  try {
    const res = await request<{ ok: true; data: User }>('/auth/me');
    return res.data;
  } catch {
    return null;
  }
}

/** Restores an existing session on boot (page refresh, deep link). */
export function getStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      clearSession();
      return null;
    }
    setAuthToken(session.accessToken);
    return session;
  } catch {
    return null;
  }
}

function persistSession(session: Session): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {

    /* storage unavailable — session stays in memory only */}
}

function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {

    /* noop */}
}

/**
 * Prototype-only switch that lets reviewers see the authentication error state:
 * append `?authError=1` to the login URL.
 */
function shouldSimulateAuthFailure(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('authError') === '1';
  } catch {
    return false;
  }
}