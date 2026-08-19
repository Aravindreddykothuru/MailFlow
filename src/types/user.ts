export interface User {
  id: string;
  name: string;
  email: string;
  /** Optional remote avatar (Google profile picture). Falls back to initials. */
  avatarUrl?: string | null;
}

export type AuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated' | 'error';

export interface Session {
  user: User;
  /** Opaque token issued by the backend after the Google OAuth exchange. */
  accessToken: string;
  expiresAt: string;
}