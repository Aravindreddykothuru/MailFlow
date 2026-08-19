import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400"
        aria-hidden="true">
        
        {icon}
      </div>
      <p className="mb-1 text-sm font-medium text-ink">{title}</p>
      <p className="max-w-xs text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>);

}