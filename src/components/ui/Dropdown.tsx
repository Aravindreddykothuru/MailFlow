import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export interface DropdownProps {
  /** Rendered inside the trigger button. */
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  /** Opens upwards — used by the sidebar footer menu. */
  placement?: 'bottom' | 'top';
  label: string;
  triggerClassName?: string;
  menuClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  placement = 'bottom',
  label,
  triggerClassName,
  menuClassName
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={label}
        onClick={() => setIsOpen((open) => !open)}
        className={cn('transition-colors duration-150 ease-out', triggerClassName)}>
        
        {trigger}
      </button>

      <AnimatePresence>
        {isOpen &&
        <motion.div
          id={menuId}
          role="menu"
          initial={{ opacity: 0, y: placement === 'top' ? 4 : -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: placement === 'top' ? 4 : -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'absolute z-50 min-w-[13rem] rounded-lg border border-line-light bg-surface py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-2',
            menuClassName
          )}>
          
            {children(() => setIsOpen(false))}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  tone?: 'default' | 'danger';
}

export function DropdownItem({ icon, tone = 'default', className, children, ...rest }: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 ease-out',
        tone === 'danger' ?
        'text-danger hover:bg-danger-bg' :
        'text-ink-secondary hover:bg-gray-50 hover:text-ink',
        className
      )}
      {...rest}>
      
      {icon}
      {children}
    </button>);

}

export function DropdownHeader({ title, subtitle }: {title: string;subtitle?: string;}) {
  return (
    <div className="border-b border-line-light px-3 py-2.5">
      <p className="truncate text-sm font-semibold text-ink">{title}</p>
      {subtitle && <p className="truncate text-xs text-ink-placeholder">{subtitle}</p>}
    </div>);

}