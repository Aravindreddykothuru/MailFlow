import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getStoredSession,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  fetchCurrentUser
} from '../services/authService';

import { ApiError } from '../types/api';
import type { AuthStatus, Session, User } from '../types/user';
import { useScreenInit } from '../useScreenInit.js';
import { isPrototypeMode } from '../lib/config';

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
  signInWithGoogle: () => Promise<boolean>;
  signInWithCredentials: (email: string, password: string) => Promise<boolean>;
  signUpWithCredentials: (name: string, email: string, password: string) => Promise<boolean>;
  signIn: () => Promise<boolean>; // Backwards compatibility alias
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
    // In prototype mode, restore from localStorage immediately.
    // In production mode, we will verify via GET /me on mount.
    return isPrototypeMode && getStoredSession() ? 'authenticated' : isPrototypeMode ? 'unauthenticated' : 'loading';
  });
  const [error, setError] = useState<string | null>(
    screenInit.authStatus === 'error' ? PREVIEW_AUTH_ERROR : null
  );

  // In production mode: verify the session cookie via GET /me on mount.
  // In prototype mode: the localStorage restore above is sufficient.
  useEffect(() => {
    if (isPrototypeMode || screenInit.authenticated) return;

    fetchCurrentUser().then((user) => {
      if (user) {
        setSession({
          accessToken: 'cookie-session',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          user,
        });
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
        setError(null);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for auth:expired events dispatched by apiClient on 401 responses.
  useEffect(() => {
    const handleExpired = () => {
      setSession(null);
      setStatus('unauthenticated');
      setError(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);


  const handleSignInWithGoogle = useCallback(async () => {
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

  const handleSignInWithCredentials = useCallback(async (email: string, password: string) => {
    setStatus('authenticating');
    setError(null);
    try {
      const next = await signInWithEmail(email, password);
      setSession(next);
      setStatus('authenticated');
      return true;
    } catch (caught) {
      setStatus('error');
      setError(
        caught instanceof ApiError ?
        caught.message :
        'Invalid email or password. Please try again.'
      );
      return false;
    }
  }, []);

  const handleSignUpWithCredentials = useCallback(async (name: string, email: string, password: string) => {
    setStatus('authenticating');
    setError(null);
    try {
      const next = await signUpWithEmail(name, email, password);
      setSession(next);
      setStatus('authenticated');
      return true;
    } catch (caught) {
      setStatus('error');
      setError(
        caught instanceof ApiError ?
        caught.message :
        'Could not create account. Please try again.'
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
      signInWithGoogle: handleSignInWithGoogle,
      signInWithCredentials: handleSignInWithCredentials,
      signUpWithCredentials: handleSignUpWithCredentials,
      signIn: handleSignInWithGoogle,
      logout,
      clearError: () => {
        setError(null);
        setStatus('unauthenticated');
      }
    }),
    [session, status, error, handleSignInWithGoogle, handleSignInWithCredentials, handleSignUpWithCredentials, logout]
  );


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}