import React from 'react';
import { AlertCircleIcon, ChevronRightIcon } from 'lucide-react';
import { GoogleIcon } from '../../components/brand/GoogleIcon';
import { MailGlyph } from '../../components/brand/MailFlowLogo';
import type { AuthStatus } from '../../types/user';

export interface GoogleAuthCardProps {
  status: AuthStatus;
  error: string | null;
  onSignIn: () => void;
  onRetry: () => void;
}

/**
 * Authentication boundary UI. The button hands off to `authService.signInWithGoogle`,
 * which is where the real OAuth redirect will live.
 */
export function GoogleAuthCard({ status, error, onSignIn, onRetry }: GoogleAuthCardProps) {
  if (status === 'authenticating') {
    return (
      <div className="mb-6 rounded-2xl border border-line-light bg-canvas p-6">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary-soft" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
            <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-primary text-white">
              <MailGlyph width={12} height={10} />
            </div>
          </div>
          <div className="text-center" role="status">
            <p className="text-sm font-semibold text-ink">Verifying your account…</p>
            <p className="mt-1 text-xs text-ink-placeholder">This usually takes a second.</p>
          </div>
        </div>
      </div>);

  }

  if (status === 'error') {
    return (
      <div className="mb-6 space-y-4 rounded-2xl border border-line-light bg-canvas p-6">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-danger-border bg-danger-bg px-4 py-3.5">
          
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-danger">Authentication failed</p>
            <p className="mt-0.5 text-xs text-danger/80">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-white text-sm font-semibold text-ink shadow-sm transition-colors duration-150 ease-out hover:border-ink-placeholder hover:bg-gray-50">
          
          <GoogleIcon />
          Try again with Google
        </button>
      </div>);

  }

  return (
    <div className="mb-6 rounded-2xl border border-line-light bg-canvas p-6">
      <p className="mb-4 text-center text-xs font-medium text-ink-placeholder">CONTINUE WITH</p>
      <button
        type="button"
        onClick={onSignIn}
        className="group flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-white text-sm font-semibold text-ink shadow-sm transition-colors duration-150 ease-out hover:border-ink-placeholder hover:bg-gray-50">
        
        <GoogleIcon />
        <span>Sign in with Google</span>
        <ChevronRightIcon
          className="ml-auto h-3.5 w-3.5 text-ink-placeholder transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          aria-hidden="true" />
        
      </button>
    </div>);

}