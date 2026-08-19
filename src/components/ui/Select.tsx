import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Field, controlBaseClass, controlStateClass, describedBy } from './Field';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id: string;
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
  /** Renders the label for screen readers only — used in compact toolbars. */
  hideLabel?: boolean;
}

export function Select({
  id,
  label,
  options,
  hint,
  error,
  hideLabel = false,
  required,
  className,
  ...rest
}: SelectProps) {
  const hasError = Boolean(error);

  const control =
  <div className="relative">
      <select
      id={id}
      required={required}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy(id, hasError, Boolean(hint))}
      aria-label={hideLabel ? label : undefined}
      className={cn(
        controlBaseClass,
        controlStateClass(hasError),
        'h-10 appearance-none pl-3 pr-9',
        className
      )}
      {...rest}>
      
        {options.map((option) =>
      <option key={option.value} value={option.value}>
            {option.label}
          </option>
      )}
      </select>
      <ChevronDownIcon
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-placeholder"
      aria-hidden="true" />
    
    </div>;


  if (hideLabel) return control;

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {control}
    </Field>);

}