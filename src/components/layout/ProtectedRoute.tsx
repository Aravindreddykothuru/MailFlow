import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/Spinner';

/** Guards the authenticated area; unauthenticated visitors land on /login. */
export function ProtectedRoute({ children }: {children: React.ReactNode;}) {
  const { user, status } = useAuth();
  const location = useLocation();

  // While the session is being verified via GET /me on mount (production mode),
  // show a full-page spinner rather than redirecting — the user may have a valid
  // httpOnly cookie that hasn't been confirmed yet.
  if (status === 'loading') {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-canvas">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }


  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}