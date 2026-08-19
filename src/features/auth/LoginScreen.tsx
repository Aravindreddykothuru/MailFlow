import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2Icon, LockIcon, ShieldCheckIcon } from 'lucide-react';
import { BrandPanel } from './BrandPanel';
import { AuthCard } from './AuthCard';
import { MailFlowLogo } from '../../components/brand/MailFlowLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { trustBadges, type TrustBadge } from '../../data/loginContent';


const BADGE_ICONS: Record<TrustBadge['icon'], React.ComponentType<{className?: string;}>> = {
  lock: LockIcon,
  shield: ShieldCheckIcon,
  check: CheckCircle2Icon
};

export function LoginScreen() {
  const {
    status,
    error,
    signInWithGoogle,
    signInWithCredentials,
    signUpWithCredentials,
    clearError,
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  function onAuthSuccess(title: string, description: string) {
    const from = (location.state as {from?: string;} | null)?.from;
    showToast({ tone: 'success', title, description });
    navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
  }

  async function handleSignInWithCredentials(email: string, pass: string) {
    const succeeded = await signInWithCredentials(email, pass);
    if (succeeded) {
      onAuthSuccess('Welcome back', 'You’re signed in.');
    }
  }

  async function handleSignUpWithCredentials(name: string, email: string, pass: string) {
    const succeeded = await signUpWithCredentials(name, email, pass);
    if (succeeded) {
      onAuthSuccess('Account created', 'Welcome to MailFlow!');
    }
  }

  async function handleSignInWithGoogle() {
    const succeeded = await signInWithGoogle();
    if (succeeded) {
      onAuthSuccess('Welcome back', 'You’re signed in with Google.');
    }
  }

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <BrandPanel />

      <div className="flex flex-1 flex-col bg-surface">
        <div className="px-6 pb-4 pt-6 md:hidden">
          <MailFlowLogo />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-8 text-center sm:text-left">
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Get started</h1>
              <p className="text-sm text-ink-muted">
                Sign in or create an account to access your scheduler.
              </p>
            </div>

            <AuthCard
              status={status}
              error={error}
              onSignInWithCredentials={handleSignInWithCredentials}
              onSignUpWithCredentials={handleSignUpWithCredentials}
              onSignInWithGoogle={handleSignInWithGoogle}
              onClearError={clearError}
            />

            

            <ul className="mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {trustBadges.map((badge) => {
                const Icon = BADGE_ICONS[badge.icon];
                return (
                  <li key={badge.label} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-ink-placeholder" aria-hidden="true" />
                    <span className="text-[11px] font-medium text-ink-placeholder">
                      {badge.label}
                    </span>
                  </li>);

              })}
            </ul>

            <p className="text-center text-xs leading-relaxed text-line">
              Secure access for registered organizational accounts only.
            </p>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line-light px-6 py-4">
          <p className="text-xs text-line">© 2024 MailFlow Inc.</p>
          <nav className="flex gap-4" aria-label="Legal">
            {['Privacy', 'Terms', 'Security'].map((label) =>
            <a
              key={label}
              href="#"
              className="text-xs text-ink-placeholder transition-colors duration-150 ease-out hover:text-ink-muted">
              
                {label}
              </a>
            )}
          </nav>
        </footer>
      </div>
    </div>);

}