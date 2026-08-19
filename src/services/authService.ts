import { config, isPrototypeMode } from '../lib/config';
import { prototypeDelay, request, setAuthToken } from './apiClient';
import { ApiError } from '../types/api';
import type { Session } from '../types/user';

const SESSION_STORAGE_KEY = 'mailflow.session';

/**
 * ─── Google authentication boundary ──────────────────────────────────────────
 * In production this redirects to Google's consent screen and the backend
 * exchanges the returned code for a session. No OAuth flow or credential is
 * simulated here: without a configured client id the prototype resolves a
 * local session so the rest of the UI can be exercised.
 */
export async function signInWithGoogle(): Promise<Session> {
  if (!isPrototypeMode && config.googleClientId) {
    // Real implementation: hand off to the provider, then exchange the code.
    const session = await request<Session>('/auth/google', { method: 'POST' });
    setAuthToken(session.accessToken);
    persistSession(session);
    return session;
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

export async function signOut(): Promise<void> {
  if (!isPrototypeMode) {
    await request<void>('/auth/logout', { method: 'POST' });
  } else {
    await prototypeDelay(300);
  }
  setAuthToken(null);
  clearSession();
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