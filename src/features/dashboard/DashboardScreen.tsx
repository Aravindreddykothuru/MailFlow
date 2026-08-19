import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, MailIcon, PenLineIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatGrid, type StatItem } from './StatGrid';
import { RecentEmailsCard, type RecentEmailItem } from './RecentEmailsCard';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { fetchScheduledEmails, fetchSentEmails } from '../../services/emailService';
import type { ScheduledEmail, SentEmail } from '../../types/email';

const isEmptyList = (rows: unknown[]) => rows.length === 0;

export function DashboardScreen() {
  const navigate = useNavigate();

  const scheduled = useAsyncResource<ScheduledEmail[]>(fetchScheduledEmails, isEmptyList);
  const sent = useAsyncResource<SentEmail[]>(fetchSentEmails, isEmptyList);

  const scheduledRows = scheduled.data ?? [];
  const sentRows = sent.data ?? [];
  const isLoading = scheduled.status === 'loading' || sent.status === 'loading';

  const stats = useMemo<StatItem[]>(() => {
    const pending = scheduledRows.filter((row) => row.status !== 'Failed').length;
    const delivered = sentRows.filter((row) => row.status === 'Sent').length;
    const failed =
    scheduledRows.filter((row) => row.status === 'Failed').length +
    sentRows.filter((row) => row.status === 'Failed').length;
    const recipients = new Set([
    ...scheduledRows.map((row) => row.email),
    ...sentRows.map((row) => row.email)]
    ).size;

    return [
    {
      key: 'scheduled',
      label: 'Scheduled',
      value: String(pending),
      sub: 'emails pending',
      icon: 'scheduled',
      tone: 'primary'
    },
    {
      key: 'sent',
      label: 'Sent',
      value: String(delivered),
      sub: 'emails dispatched',
      icon: 'sent',
      tone: 'success'
    },
    {
      key: 'failed',
      label: 'Failed',
      value: String(failed),
      sub: 'need attention',
      icon: 'failed',
      tone: 'danger'
    },
    {
      key: 'recipients',
      label: 'Recipients',
      value: String(recipients),
      sub: 'in active campaigns',
      icon: 'recipients',
      tone: 'neutral'
    }];

  }, [scheduledRows, sentRows]);

  const recentScheduled: RecentEmailItem[] = scheduledRows.slice(0, 3).map((row) => ({
    id: row.id,
    email: row.email,
    subject: row.subject,
    timestamp: row.scheduledAt,
    status: row.status
  }));

  const recentSent: RecentEmailItem[] = sentRows.slice(0, 3).map((row) => ({
    id: row.id,
    email: row.email,
    subject: row.subject,
    timestamp: row.sentAt,
    status: row.status
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Dashboard" description="Overview of your email scheduling activity." />

      <StatGrid stats={stats} isLoading={isLoading} />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/compose')}
          className="flex items-center gap-4 rounded-lg bg-primary p-5 text-left text-white transition-colors duration-150 ease-out hover:bg-primary-hover">
          
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/20"
            aria-hidden="true">
            
            <PenLineIcon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">Compose New Email</span>
            <span className="mt-0.5 block text-sm text-blue-200">
              Upload a CSV and schedule a campaign
            </span>
          </span>
        </button>

        <Link
          to="/scheduled"
          className="flex items-center gap-4 rounded-lg border border-line-light bg-surface p-5 text-left transition-colors duration-150 ease-out hover:bg-gray-50">
          
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary"
            aria-hidden="true">
            
            <CalendarDaysIcon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-ink">Manage Scheduled</span>
            <span className="mt-0.5 block text-sm text-ink-muted">
              Review and cancel upcoming sends
            </span>
          </span>
        </Link>
      </div>

      <div className="space-y-6">
        <RecentEmailsCard
          title="Recent Scheduled Emails"
          viewAllTo="/scheduled"
          items={recentScheduled}
          status={scheduled.status}
          onRetry={scheduled.reload}
          emptyIcon={<CalendarDaysIcon className="h-6 w-6" strokeWidth={1.75} />}
          emptyTitle="No scheduled emails"
          emptyDescription="Compose a new campaign to schedule your first dispatch." />
        

        <RecentEmailsCard
          title="Recent Sent Emails"
          viewAllTo="/sent"
          items={recentSent}
          status={sent.status}
          onRetry={sent.reload}
          emptyIcon={<MailIcon className="h-6 w-6" strokeWidth={1.75} />}
          emptyTitle="No sent emails yet"
          emptyDescription="Emails you dispatch will appear here once sent." />
        
      </div>
    </div>);

}