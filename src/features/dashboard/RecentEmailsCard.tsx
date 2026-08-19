import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatDateTime } from '../../lib/format';
import type { ResourceStatus } from '../../types/api';
import type { EmailStatus } from '../../types/email';

export interface RecentEmailItem {
  id: string;
  email: string;
  subject: string;
  timestamp: string;
  status: EmailStatus;
}

export interface RecentEmailsCardProps {
  title: string;
  viewAllTo: string;
  items: RecentEmailItem[];
  status: ResourceStatus;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
}

export function RecentEmailsCard({
  title,
  viewAllTo,
  items,
  status,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onRetry
}: RecentEmailsCardProps) {
  return (
    <Card as="section">
      <CardHeader
        title={title}
        action={
        <Link
          to={viewAllTo}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
          
            View all
            <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
          </Link>
        } />
      

      {status === 'loading' ?
      <TableSkeleton rows={3} /> :
      status === 'error' ?
      <ErrorState onRetry={onRetry} /> :
      items.length === 0 ?
      <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} /> :

      <ul className="divide-y divide-line-subtle">
          {items.map((item) =>
        <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={item.email} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.subject}</p>
                <p className="truncate text-xs text-ink-placeholder">{item.email}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="hidden text-xs text-ink-muted sm:block">
                  {formatDateTime(item.timestamp)}
                </p>
                <div className="mt-1 flex justify-end">
                  <StatusBadge status={item.status} />
                </div>
              </div>
            </li>
        )}
        </ul>
      }
    </Card>);

}