import React from 'react';
import { cn } from '../../lib/cn';
import type { EmailStatus } from '../../types/email';

const STYLES: Record<EmailStatus, string> = {
  Scheduled: 'bg-pending-bg text-pending-text',
  Processing: 'bg-processing-bg text-processing-text',
  Sent: 'bg-success-bg text-success-text',
  Failed: 'bg-danger-bg text-danger'
};

const DOTS: Partial<Record<EmailStatus, string>> = {
  Scheduled: 'bg-slate-400',
  Processing: 'bg-primary',
  Sent: 'bg-success',
  Failed: 'bg-danger'
};

export interface StatusBadgeProps {
  status: EmailStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        STYLES[status],
        className
      )}>
      
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          DOTS[status],
          status === 'Processing' && 'animate-pulse'
        )}
        aria-hidden="true" />
      
      {status}
    </span>);

}