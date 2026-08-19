import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getStoredSession, signInWithGoogle, signOut } from '../services/authService';
import { ApiError } from '../types/api';
import type { AuthStatus, Session, User } from '../types/user';
import { useScreenInit } from '../useScreenInit.js';

/** Session used when a Screens preview opens an authenticated route directly. */
const PREVIEW_SESSION: Session = {
  accessToken: 'preview-session',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  user: { id: 'usr_1', name: 'John Doe', email: 'john@example.com', avatarUrl: null }
};

const PREVIEW_AUTH_ERROR =
"Your account wasn't recognized. Check that you're using a registered org email.";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  signIn: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const screenInit = useScreenInit() as {
    authenticated?: boolean;
    authStatus?: AuthStatus;
  };

  const [session, setSession] = useState<Session | null>(() =>
  screenInit.authenticated ? PREVIEW_SESSION : getStoredSession()
  );
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (screenInit.authenticated) return 'authenticated';
    if (screenInit.authStatus) return screenInit.authStatus;
    return getStoredSession() ? 'authenticated' : 'unauthenticated';
  });
  const [error, setError] = useState<string | null>(
    screenInit.authStatus === 'error' ? PREVIEW_AUTH_ERROR : null
  );

  const signIn = useCallback(async () => {
    setStatus('authenticating');
    setError(null);
    try {
      const next = await signInWithGoogle();
      setSession(next);
      setStatus('authenticated');
      return true;
    } catch (caught) {
      setStatus('error');
      setError(
        caught instanceof ApiError ?
        caught.message :
        'We couldn’t complete sign-in. Please try again.'
      );
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      status,
      error,
      signIn,
      logout,
      clearError: () => {
        setError(null);
        setStatus('unauthenticated');
      }
    }),
    [session, status, error, signIn, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}