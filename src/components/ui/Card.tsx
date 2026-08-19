import React from 'react';
import { cn } from '../../lib/cn';

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'section';
}

/** The surface used for every panel in the design: white, hairline, 12px radius. */
export function Card({ className, children, as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={cn('overflow-hidden rounded-lg border border-line-light bg-surface', className)}>
      {children}
    </Tag>);

}

export interface CardHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, icon, action, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-line-light px-5 py-4',
        className
      )}>
      
      <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
        {icon &&
        <span className="text-primary" aria-hidden="true">
            {icon}
          </span>
        }
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </div>);

}