import { useEffect, useMemo, useState } from 'react';
import type { EmailRecord } from '../types/email';

export const ROWS_PER_PAGE = 5;

interface UseEmailTableOptions<T extends EmailRecord> {
  rows: T[];
  /** Status of each row, used by the status filter. */
  getStatus: (row: T) => string;
  search: string;
  statusFilter: string;
}

export interface EmailTableResult<T> {
  visibleRows: T[];
  filteredCount: number;
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
}

/** Shared filtering, searching and pagination for the two email tables. */
export function useEmailTable<T extends EmailRecord>({
  rows,
  getStatus,
  search,
  statusFilter
}: UseEmailTableOptions<T>): EmailTableResult<T> {
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || getStatus(row) === statusFilter;
      const matchesQuery =
      query.length === 0 ||
      row.email.toLowerCase().includes(query) ||
      row.subject.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [rows, search, statusFilter, getStatus]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, rows.length]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visibleRows = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return { visibleRows, filteredCount: filtered.length, page, pageCount, setPage };
}