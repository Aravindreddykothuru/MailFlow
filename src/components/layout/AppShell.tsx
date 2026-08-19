import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon, MenuIcon, XIcon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';
import { MailFlowLogo } from '../brand/MailFlowLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/compose': 'Compose',
  '/scheduled': 'Scheduled Emails',
  '/sent': 'Sent Emails'
};

export function AppShell() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    showToast({ tone: 'info', title: 'Signed out', description: 'Your session has ended.' });
    navigate('/login', { replace: true });
  }

  const title = PAGE_TITLES[location.pathname] ?? 'Dashboard';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      {/* Mobile header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line-light bg-surface px-4 md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={isDrawerOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 ease-out hover:bg-gray-50">
            
            <MenuIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <MailFlowLogo />
        </div>
        <UserMenu user={user} onLogout={handleLogout} />
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex">
          <Sidebar user={user} onLogout={handleLogout} onCompose={() => navigate('/compose')} />
        </div>

        {/* Mobile navigation drawer */}
        <AnimatePresence>
          {isDrawerOpen &&
          <div className="fixed inset-0 z-50 flex md:hidden">
              <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => setIsDrawerOpen(false)} />
            
              <motion.div
              role="dialog"
              aria-label="Navigation"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
              className="relative z-10 h-full">
              
                <Sidebar
                user={user}
                onLogout={handleLogout}
                onNavigate={() => setIsDrawerOpen(false)}
                onCompose={() => navigate('/compose')} />
              
                <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close navigation"
                className="absolute -right-11 top-3 flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-ink-muted">
                
                  <XIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </motion.div>
            </div>
          }
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop top bar */}
          <div className="hidden h-14 shrink-0 items-center justify-between border-b border-line-light bg-surface px-6 md:flex">
            <p className="text-sm font-medium text-ink">{title}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink-placeholder transition-colors duration-150 ease-out hover:bg-gray-50 hover:text-ink">
                
                <BellIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-primary" />
              </button>
              <div className="h-5 w-px bg-line-light" />
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>);

}