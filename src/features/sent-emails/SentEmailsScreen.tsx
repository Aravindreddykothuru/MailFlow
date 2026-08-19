import React, { useMemo, useState } from 'react';
import { EyeIcon, MailIcon, ExternalLink } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, type Column } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmailListToolbar } from '../emails/EmailListToolbar';
import { SentEmailDetailDialog } from './SentEmailDetailDialog';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { ROWS_PER_PAGE, useEmailTable } from '../../hooks/useEmailTable';
import { fetchSentEmails } from '../../services/emailService';
import { formatDateTime } from '../../lib/format';
import type { SentEmail } from '../../types/email';

const isEmptyList = (rows: SentEmail[]) => rows.length === 0;
const getStatus = (row: SentEmail) => row.status;

export function SentEmailsScreen() {
  const resource = useAsyncResource<SentEmail[]>(fetchSentEmails, isEmptyList);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<SentEmail | null>(null);

  const rows = resource.data ?? [];

  const { visibleRows, filteredCount, page, pageCount, setPage } = useEmailTable({
    rows,
    getStatus,
    search,
    statusFilter
  });

  const filters = useMemo(
    () => [
    { value: 'all', label: 'All', count: rows.length },
    { value: 'Sent', label: 'Sent', count: rows.filter((row) => row.status === 'Sent').length },
    {
      value: 'Failed',
      label: 'Failed',
      count: rows.filter((row) => row.status === 'Failed').length
    }],

    [rows]
  );

  const columns: Column<SentEmail>[] = [
  {
    key: 'email',
    header: 'Email',
    width: '30%',
    cell: (row) =>
    <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={row.recipientName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{row.recipientName}</p>
            <p className="truncate text-xs text-ink-placeholder">{row.email}</p>
          </div>
        </div>

  },
  {
    key: 'subject',
    header: 'Subject',
    width: '32%',
    cell: (row) => <span className="block truncate text-sm text-ink-secondary">{row.subject}</span>
  },
  {
    key: 'sentAt',
    header: 'Sent time',
    width: '22%',
    cell: (row) =>
    <span className="whitespace-nowrap text-sm text-ink-muted">
          {formatDateTime(row.sentAt)}
        </span>

  },
  {
    key: 'status',
    header: 'Status',
    width: '10%',
    cell: (row) => <StatusBadge status={row.status} />
  },
  {
    key: 'actions',
    header: 'Actions',
    width: '8%',
    align: 'right',
    srOnlyHeader: true,
    cell: (row) => (
      <div className="flex items-center justify-end gap-1">
        {row.previewUrl && row.previewUrl.startsWith('http') && (
          <a
            href={row.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open email in Ethereal Sandbox"
            aria-label={`Open Ethereal preview for ${row.email}`}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-primary transition-colors duration-150 ease-out hover:bg-primary/10"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        <button
          type="button"
          onClick={() => setSelected(row)}
          aria-label={`View delivery details for ${row.email}`}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-placeholder transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-ink"
        >
          <EyeIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    )
  }];


  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Sent Emails"
        description="Review previously dispatched campaigns and notifications." />
      

      <Card as="section">
        {resource.status !== 'error' &&
        <EmailListToolbar
          searchId="sent-search"
          searchValue={search}
          searchPlaceholder="Search sent emails…"
          onSearchChange={setSearch}
          filters={filters}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          disabled={resource.status === 'loading'} />

        }

        {resource.status === 'loading' ?
        <TableSkeleton rows={5} /> :
        resource.status === 'error' ?
        <ErrorState description={resource.error ?? undefined} onRetry={resource.reload} /> :
        filteredCount === 0 ?
        <EmptyState
          icon={<MailIcon className="h-6 w-6" strokeWidth={1.75} />}
          title={rows.length === 0 ? 'No sent emails yet' : 'No results found'}
          description={
          rows.length === 0 ?
          'Emails you dispatch will appear here once sent.' :
          'Try a different search term or clear the status filter.'
          }
          action={
          rows.length > 0 ?
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}>
            
                  Clear filters
                </Button> :
          undefined
          } /> :


        <>
            <Table
            caption="Sent emails with recipient, subject, sent time and delivery status"
            columns={columns}
            rows={visibleRows}
            getRowKey={(row) => row.id}
            renderMobileCard={(row) =>
            <button
              type="button"
              onClick={() => setSelected(row)}
              className="flex w-full items-start gap-3 text-left">
              
                  <Avatar name={row.recipientName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {row.subject}
                    </span>
                    <span className="block truncate text-xs text-ink-placeholder">{row.email}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={row.status} />
                      <span className="text-xs text-ink-muted">{formatDateTime(row.sentAt)}</span>
                    </span>
                  </span>
                  <EyeIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-ink-placeholder"
                aria-hidden="true" />
              
                </button>
            } />
          
            <Pagination
            page={page}
            pageCount={pageCount}
            total={filteredCount}
            perPage={ROWS_PER_PAGE}
            itemLabel="sent emails"
            onPageChange={setPage} />
          
          </>
        }
      </Card>

      <SentEmailDetailDialog email={selected} onClose={() => setSelected(null)} />
    </div>);

}