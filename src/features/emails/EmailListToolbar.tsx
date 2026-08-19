import React from 'react';
import { SearchIcon } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { Tabs, type TabItem } from '../../components/ui/Tabs';

export interface EmailListToolbarProps {
  searchId: string;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  filters: TabItem[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Search + status filter row shared by the scheduled and sent tables.
 * The filter renders as tabs on tablet and up, and as a select on mobile so it
 * never overflows.
 */
export function EmailListToolbar({
  searchId,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  disabled = false
}: EmailListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-line-light px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-line-light bg-gray-50 px-3 transition-colors duration-150 ease-out focus-within:border-primary focus-within:bg-white lg:max-w-xs">
        <SearchIcon className="h-4 w-4 shrink-0 text-ink-placeholder" aria-hidden="true" />
        <input
          id={searchId}
          type="search"
          value={searchValue}
          disabled={disabled}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-placeholder" />
        
      </div>

      <div className="hidden sm:block">
        <Tabs
          items={filters}
          value={activeFilter}
          onChange={onFilterChange}
          ariaLabel="Filter by status" />
        
      </div>

      <div className="sm:hidden">
        <Select
          id={`${searchId}-status`}
          label="Filter by status"
          hideLabel
          value={activeFilter}
          disabled={disabled}
          onChange={(event) => onFilterChange(event.target.value)}
          options={filters.map((filter) => ({
            value: filter.value,
            label:
            typeof filter.count === 'number' ?
            `${filter.label} (${filter.count})` :
            filter.label
          }))} />
        
      </div>
    </div>);

}