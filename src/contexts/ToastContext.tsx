import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ToastViewport, type ToastMessage, type ToastTone } from '../components/ui/Toast';

interface ToastInput {
  tone: ToastTone;
  title: string;
  description?: string;
  /** Auto-dismiss delay in ms. Pass 0 to keep the toast until dismissed. */
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: {children: React.ReactNode;}) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ duration = 4500, ...toast }: ToastInput) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-2), { id, ...toast }]);
      if (duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismissToast(id), duration)
        );
      }
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>);

}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}