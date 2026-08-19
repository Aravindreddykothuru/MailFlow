import React from 'react';
import { cn } from '../../lib/cn';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Fixed or proportional width applied to the column on tablet and up. */
  width?: string;
  align?: 'left' | 'right';
  /** Keeps the column in the DOM but hides its header text (e.g. actions). */
  srOnlyHeader?: boolean;
}

export interface TableProps<T> {
  /** Accessible description of the table contents. */
  caption: string;
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Mobile presentation. When provided, rows become stacked cards below `md`. */
  renderMobileCard?: (row: T) => React.ReactNode;
  /** Minimum table width before horizontal scrolling kicks in. */
  minWidth?: number;
}

export function Table<T>({
  caption,
  columns,
  rows,
  getRowKey,
  renderMobileCard,
  minWidth = 720
}: TableProps<T>) {
  return (
    <>
      <div className={cn('overflow-x-auto', renderMobileCard && 'hidden md:block')}>
        <table className="w-full border-collapse text-left" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line-light bg-gray-50">
              {columns.map((column) =>
              <th
                key={column.key}
                scope="col"
                style={{ width: column.width }}
                className={cn(
                  'px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-placeholder',
                  column.align === 'right' && 'text-right'
                )}>
                
                  <span className={column.srOnlyHeader ? 'sr-only' : undefined}>
                    {column.header}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {rows.map((row) =>
            <tr
              key={getRowKey(row)}
              className="transition-colors duration-150 ease-out hover:bg-gray-50/60">
              
                {columns.map((column) =>
              <td
                key={column.key}
                className={cn(
                  'px-5 py-4 align-middle',
                  column.align === 'right' && 'text-right'
                )}>
                
                    {column.cell(row)}
                  </td>
              )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {renderMobileCard &&
      <ul className="divide-y divide-line-subtle md:hidden">
          {rows.map((row) =>
        <li key={getRowKey(row)} className="px-5 py-4">
              {renderMobileCard(row)}
            </li>
        )}
        </ul>
      }
    </>);

}