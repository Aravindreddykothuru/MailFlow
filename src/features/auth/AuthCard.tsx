import React, { useState } from 'react';
import { AlertCircleIcon, ArrowRightIcon, LockIcon, MailIcon, UserIcon } from 'lucide-react';
import { GoogleIcon } from '../../components/brand/GoogleIcon';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { AuthStatus } from '../../types/user';

export interface AuthCardProps {
  status: AuthStatus;
  error: string | null;
  onSignInWithCredentials: (email: string, password: string) => Promise<void>;
  onSignUpWithCredentials: (name: string, email: string, password: string) => Promise<void>;
  onSignInWithGoogle: () => void;
  onClearError: () => void;
}

export function AuthCard({
  status,
  error,
  onSignInWithCredentials,
  onSignUpWithCredentials,
  onSignInWithGoogle,
  onClearError,
}: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const isSubmitting = status === 'authenticating';

  function handleTabSwitch(nextMode: 'signin' | 'signup') {
    setMode(nextMode);
    setFormErrors({});
    onClearError();
  }

  function validate(): boolean {
    const errors: { name?: string; email?: string; password?: string } = {};

    if (mode === 'signup' && !name.trim()) {
      errors.name = 'Please enter your full name.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    if (mode === 'signin') {
      await onSignInWithCredentials(email.trim(), password);
    } else {
      await onSignUpWithCredentials(name.trim(), email.trim(), password);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-line-light bg-canvas p-6 shadow-sm">
      {/* ── Mode Tabs ────────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-surface-muted p-1 border border-line-light">
        <button
          type="button"
          onClick={() => handleTabSwitch('signin')}
          className={`rounded-md py-2 text-xs font-semibold transition-all duration-150 ${
            mode === 'signin'
              ? 'bg-white text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}>
          Sign In
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch('signup')}
          className={`rounded-md py-2 text-xs font-semibold transition-all duration-150 ${
            mode === 'signup'
              ? 'bg-white text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}>
          Sign Up
        </button>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-danger-border bg-danger-bg px-4 py-3">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-danger">Authentication failed</p>
            <p className="mt-0.5 text-xs text-danger/80">{error}</p>
          </div>
        </div>
      )}

      {/* ── Email & Password Form ────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {mode === 'signup' && (
          <Input
            id="auth-name"
            label="Full Name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={formErrors.name}
            icon={<UserIcon className="h-4 w-4" />}
            required
            autoComplete="name"
          />
        )}

        <Input
          id="auth-email"
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={formErrors.email}
          icon={<MailIcon className="h-4 w-4" />}
          required
          autoComplete="email"
        />

        <Input
          id="auth-password"
          label="Password"
          type="password"
          placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={formErrors.password}
          icon={<LockIcon className="h-4 w-4" />}
          required
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />

        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText={mode === 'signin' ? 'Signing in…' : 'Creating account…'}
          className="w-full"
          trailingIcon={<ArrowRightIcon className="h-4 w-4" />}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      {/* ── Divider ──────────────────────────────────────────────────────────── */}
      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line-light" />
        </div>
        <span className="relative bg-canvas px-3 text-[11px] font-medium tracking-wider text-ink-placeholder uppercase">
          Or continue with
        </span>
      </div>

      {/* ── Google OAuth Button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onSignInWithGoogle}
        disabled={isSubmitting}
        className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-white text-sm font-semibold text-ink shadow-sm transition-colors duration-150 ease-out hover:border-ink-placeholder hover:bg-gray-50 disabled:opacity-60">
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
