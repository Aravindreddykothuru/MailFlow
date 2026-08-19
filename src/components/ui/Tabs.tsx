import React, { useRef } from 'react';
import { cn } from '../../lib/cn';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

/** Roving-tabindex tablist. Arrow keys move between tabs, Home/End jump to ends. */
export function Tabs({ items, value, onChange, ariaLabel, className }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTab(index: number) {
    const next = (index + items.length) % items.length;
    onChange(items[next].value);
    refs.current[next]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusTab(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusTab(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusTab(items.length - 1);
    }
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex items-center gap-1', className)}>
      {items.map((item, index) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${item.value}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-150 ease-out',
              isActive ?
              'bg-primary-soft text-primary' :
              'text-ink-secondary hover:bg-gray-50 hover:text-ink'
            )}>
            
            {item.label}
            {typeof item.count === 'number' &&
            <span
              className={cn(
                'rounded-full px-1.5 text-[11px] tabular-nums',
                isActive ? 'bg-white text-primary' : 'bg-gray-100 text-ink-placeholder'
              )}>
              
                {item.count}
              </span>
            }
          </button>);

      })}
    </div>);

}