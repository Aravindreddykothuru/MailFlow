import React, { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  footer,
  children,
  size = 'sm'
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen &&
      <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
          <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose} />
        
          <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'relative z-10 w-full rounded-lg border border-line-light bg-surface shadow-xl',
            size === 'sm' ? 'max-w-md' : 'max-w-xl'
          )}>
          
            <div className="flex items-start justify-between gap-4 border-b border-line-light px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-sm font-semibold text-ink">
                  {title}
                </h2>
                {description &&
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                    {description}
                  </p>
              }
              </div>
              <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-placeholder transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-ink">
              
                <XIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {children && <div className="px-5 py-4">{children}</div>}

            {footer &&
          <div className="flex flex-col-reverse gap-2 border-t border-line-light px-5 py-4 sm:flex-row sm:justify-end">
                {footer}
              </div>
          }
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}