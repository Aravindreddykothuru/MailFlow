import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComposePage } from './pages/ComposePage';
import { ScheduledEmailsPage } from './pages/ScheduledEmailsPage';
import { SentEmailsPage } from './pages/SentEmailsPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="h-full min-h-full w-full bg-canvas">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }>
                
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/compose" element={<ComposePage />} />
                <Route path="/scheduled" element={<ScheduledEmailsPage />} />
                <Route path="/sent" element={<SentEmailsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>);

}