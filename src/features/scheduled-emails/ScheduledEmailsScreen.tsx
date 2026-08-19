import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, PlusIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, type Column } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmailListToolbar } from '../emails/EmailListToolbar';
import { CancelScheduleDialog } from './CancelScheduleDialog';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { ROWS_PER_PAGE, useEmailTable } from '../../hooks/useEmailTable';
import { cancelScheduledEmail, fetchScheduledEmails } from '../../services/emailService';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime } from '../../lib/format';
import { ApiError } from '../../types/api';
import type { ScheduledEmail } from '../../types/email';

const isEmptyList = (rows: ScheduledEmail[]) => rows.length === 0;
const getStatus = (row: ScheduledEmail) => row.status;

export function ScheduledEmailsScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const resource = useAsyncResource<ScheduledEmail[]>(fetchScheduledEmails, isEmptyList);

  const [rows, setRows] = useState<ScheduledEmail[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingCancel, setPendingCancel] = useState<ScheduledEmail | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setRows(resource.data ?? []);
  }, [resource.data]);

  const { visibleRows, filteredCount, page, pageCount, setPage } = useEmailTable({
    rows,
    getStatus,
    search,
    statusFilter
  });

  const filters = useMemo(
    () => [
    { value: 'all', label: 'All', count: rows.length },
    {
      value: 'Scheduled',
      label: 'Scheduled',
      count: rows.filter((row) => row.status === 'Scheduled').length
    },
    {
      value: 'Processing',
      label: 'Processing',
      count: rows.filter((row) => row.status === 'Processing').length
    },
    {
      value: 'Failed',
      label: 'Failed',
      count: rows.filter((row) => row.status === 'Failed').length
    }],

    [rows]
  );

  async function handleConfirmCancel() {
    if (!pendingCancel) return;
    setIsCancelling(true);
    try {
      await cancelScheduledEmail(pendingCancel.id);
      setRows((current) => current.filter((row) => row.id !== pendingCancel.id));
      showToast({
        tone: 'success',
        title: 'Scheduled email cancelled',
        description: `${pendingCancel.email} will no longer receive this send.`
      });
      setPendingCancel(null);
    } catch (caught) {
      showToast({
        tone: 'error',
        title: 'Couldn’t cancel that send',
        description:
        caught instanceof ApiError ? caught.message : 'Please try again in a moment.'
      });
    } finally {
      setIsCancelling(false);
    }
  }

  const columns: Column<ScheduledEmail>[] = [
  {
    key: 'email',
    header: 'Email',
    width: '28%',
    cell: (row) =>
    <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={row.email} size="sm" />
          <span className="truncate text-sm text-ink">{row.email}</span>
        </div>

  },
  {
    key: 'subject',
    header: 'Subject',
    width: '32%',
    cell: (row) => <span className="block truncate text-sm text-ink-secondary">{row.subject}</span>
  },
  {
    key: 'scheduledAt',
    header: 'Scheduled time',
    width: '22%',
    cell: (row) =>
    <span className="whitespace-nowrap text-sm text-ink-muted">
          {formatDateTime(row.scheduledAt)}
        </span>

  },
  {
    key: 'status',
    header: 'Status',
    width: '12%',
    cell: (row) => <StatusBadge status={row.status} />
  },
  {
    key: 'actions',
    header: 'Actions',
    width: '6%',
    align: 'right',
    srOnlyHeader: true,
    cell: (row) =>
    <button
      type="button"
      onClick={() => setPendingCancel(row)}
      aria-label={`Cancel scheduled email to ${row.email}`}
      className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-placeholder transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-ink">
      
          <XIcon className="h-4 w-4" aria-hidden="true" />
        </button>

  }];


  const showToolbar = resource.status !== 'error';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Scheduled Emails"
        description="Manage and track your upcoming email dispatches."
        actions={
        <Button
          size="sm"
          onClick={() => navigate('/compose')}
          leadingIcon={<PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />}>
          
            Compose New Email
          </Button>
        } />
      

      <Card as="section">
        {showToolbar &&
        <EmailListToolbar
          searchId="scheduled-search"
          searchValue={search}
          searchPlaceholder="Search scheduled emails…"
          onSearchChange={setSearch}
          filters={filters}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          disabled={resource.status === 'loading'} />

        }

        {resource.status === 'loading' ?
        <TableSkeleton rows={5} /> :
        resource.status === 'error' ?
        <ErrorState
          description={resource.error ?? undefined}
          onRetry={resource.reload} /> :

        filteredCount === 0 ?
        <EmptyState
          icon={<CalendarDaysIcon className="h-6 w-6" strokeWidth={1.75} />}
          title={rows.length === 0 ? 'No scheduled emails' : 'No emails match your filters'}
          description={
          rows.length === 0 ?
          'Compose a new campaign to schedule your first email dispatch.' :
          'Try a different search term or clear the status filter.'
          }
          action={
          rows.length === 0 ?
          <Button size="sm" onClick={() => navigate('/compose')}>
                  Compose New Email
                </Button> :

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}>
            
                  Clear filters
                </Button>

          } /> :


        <>
            <Table
            caption="Scheduled emails with recipient, subject, scheduled time and status"
            columns={columns}
            rows={visibleRows}
            getRowKey={(row) => row.id}
            renderMobileCard={(row) =>
            <div className="flex items-start gap-3">
                  <Avatar name={row.email} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{row.subject}</p>
                    <p className="truncate text-xs text-ink-placeholder">{row.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={row.status} />
                      <span className="text-xs text-ink-muted">
                        {formatDateTime(row.scheduledAt)}
                      </span>
                    </div>
                  </div>
                  <button
                type="button"
                onClick={() => setPendingCancel(row)}
                aria-label={`Cancel scheduled email to ${row.email}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-ink-placeholder transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-ink">
                
                    <XIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
            } />
          
            <Pagination
            page={page}
            pageCount={pageCount}
            total={filteredCount}
            perPage={ROWS_PER_PAGE}
            itemLabel="scheduled emails"
            onPageChange={setPage} />
          
          </>
        }
      </Card>

      <CancelScheduleDialog
        email={pendingCancel}
        isSubmitting={isCancelling}
        onClose={() => setPendingCancel(null)}
        onConfirm={handleConfirmCancel} />
      
    </div>);

}