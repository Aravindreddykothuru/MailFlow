import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

export interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  /** e.g. "scheduled emails" */
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageCount,
  total,
  perPage,
  itemLabel,
  onPageChange
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-light px-5 py-3.5">
      <p className="text-xs text-ink-placeholder">
        Showing {from}–{to} of {total} {itemLabel}
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-line-light text-ink-muted transition-colors duration-150 ease-out hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
          
          <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span className="px-1 text-xs tabular-nums text-ink-muted">
          {page} / {Math.max(pageCount, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-line-light text-ink-muted transition-colors duration-150 ease-out hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
          
          <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </nav>
    </div>);

}