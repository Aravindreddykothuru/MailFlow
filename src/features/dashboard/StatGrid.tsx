import React from 'react';
import { CalendarClockIcon, CircleAlertIcon, SendIcon, UsersIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Skeleton } from '../../components/ui/LoadingSkeleton';

export interface StatItem {
  key: string;
  label: string;
  value: string;
  sub: string;
  icon: 'scheduled' | 'sent' | 'failed' | 'recipients';
  tone: 'primary' | 'success' | 'danger' | 'neutral';
}

const ICONS = {
  scheduled: CalendarClockIcon,
  sent: SendIcon,
  failed: CircleAlertIcon,
  recipients: UsersIcon
} as const;

const TONES: Record<StatItem['tone'], {chip: string;value: string;}> = {
  primary: { chip: 'bg-primary-soft text-primary', value: 'text-primary' },
  success: { chip: 'bg-success-bg text-success', value: 'text-success-text' },
  danger: { chip: 'bg-danger-bg text-danger', value: 'text-danger' },
  neutral: { chip: 'bg-gray-50 text-ink-secondary', value: 'text-ink-secondary' }
};

export function StatGrid({ stats, isLoading }: {stats: StatItem[];isLoading: boolean;}) {
  return (
    <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = ICONS[stat.icon];
        const tone = TONES[stat.tone];
        return (
          <div
            key={stat.key}
            className="rounded-lg border border-line-light bg-surface p-5">
            
            <div
              className={cn('mb-3 flex h-8 w-8 items-center justify-center rounded-md', tone.chip)}
              aria-hidden="true">
              
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            {isLoading ?
            <Skeleton className="h-8 w-16" /> :

            <dd className={cn('text-2xl font-bold tabular-nums', tone.value)}>{stat.value}</dd>
            }
            <dt className="mt-0.5 text-xs text-ink-placeholder">{stat.label}</dt>
            <p className="mt-0.5 text-xs text-ink-muted">{stat.sub}</p>
          </div>);

      })}
    </dl>);

}