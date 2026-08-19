import React from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Shared label / hint / error scaffolding for every form control. */
export function Field({ id, label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-secondary">
        {label}
        {required &&
        <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        }
      </label>
      {children}
      {error ?
      <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-xs text-danger">
          <AlertCircleIcon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p> :
      hint ?
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-placeholder">
          {hint}
        </p> :
      null}
    </div>);

}

export const controlBaseClass =
'w-full rounded-md border bg-white text-sm text-ink placeholder:text-ink-placeholder transition-colors duration-150 ease-out focus:outline-none focus:ring-2';

export function controlStateClass(hasError: boolean): string {
  return hasError ?
  'border-danger focus:border-danger focus:ring-danger-border' :
  'border-line-light focus:border-primary focus:ring-primary-soft';
}

export function describedBy(id: string, hasError: boolean, hasHint: boolean): string | undefined {
  if (hasError) return `${id}-error`;
  if (hasHint) return `${id}-hint`;
  return undefined;
}