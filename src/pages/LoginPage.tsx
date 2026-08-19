import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoginScreen } from '../features/auth/LoginScreen';
import { useAuth } from '../contexts/AuthContext';

/** Route: /login */
export function LoginPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginScreen />;
}