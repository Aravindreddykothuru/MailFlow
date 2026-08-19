import React from 'react';
import { cn } from '../../lib/cn';
import { Field, controlBaseClass, controlStateClass, describedBy } from './Field';

export interface TextareaProps extends
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Optional toolbar rendered flush on top of the control. */
  toolbar?: React.ReactNode;
}

export function Textarea({
  id,
  label,
  hint,
  error,
  toolbar,
  required,
  rows = 7,
  className,
  ...rest
}: TextareaProps) {
  const hasError = Boolean(error);
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {toolbar &&
      <div
        className={cn(
          'flex items-center gap-1 rounded-t-md border border-b-0 bg-gray-50 px-3 py-2',
          hasError ? 'border-danger' : 'border-line-light'
        )}>
        
          {toolbar}
        </div>
      }
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy(id, hasError, Boolean(hint))}
        className={cn(
          controlBaseClass,
          controlStateClass(hasError),
          'resize-none px-3 py-2.5',
          toolbar ? 'rounded-t-none' : '',
          className
        )}
        {...rest} />
      
    </Field>);

}