import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, XIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

const TONE_STYLES: Record<ToastTone, {wrapper: string;icon: React.ReactNode;}> = {
  success: {
    wrapper: 'border-success-border bg-success-bg',
    icon: <CheckCircle2Icon className="h-4 w-4 text-success" aria-hidden="true" />
  },
  error: {
    wrapper: 'border-danger-border bg-danger-bg',
    icon: <AlertCircleIcon className="h-4 w-4 text-danger" aria-hidden="true" />
  },
  info: {
    wrapper: 'border-line-light bg-surface',
    icon: <InfoIcon className="h-4 w-4 text-primary" aria-hidden="true" />
  }
};

export interface ToastViewportProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-auto sm:w-[22rem]">
      
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = TONE_STYLES[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
                tone.wrapper
              )}>
              
              <span className="mt-0.5 shrink-0">{tone.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{toast.title}</p>
                {toast.description &&
                <p className="mt-0.5 break-words text-xs text-ink-muted">{toast.description}</p>
                }
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-ink-placeholder transition-colors duration-150 ease-out hover:bg-black/5 hover:text-ink">
                
                <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </motion.div>);

        })}
      </AnimatePresence>
    </div>);

}