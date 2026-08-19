import React from 'react';
import { cn } from '../../lib/cn';
import { Field, controlBaseClass, controlStateClass, describedBy } from './Field';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  fieldClassName?: string;
}

export function Input({
  id,
  label,
  hint,
  error,
  icon,
  required,
  className,
  fieldClassName,
  ...rest
}: InputProps) {
  const hasError = Boolean(error);
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}>
      
      <div className="relative">
        {icon &&
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-placeholder"
          aria-hidden="true">
          
            {icon}
          </span>
        }
        <input
          id={id}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy(id, hasError, Boolean(hint))}
          className={cn(
            controlBaseClass,
            controlStateClass(hasError),
            'h-10 px-3',
            icon && 'pl-9',
            className
          )}
          {...rest} />
        
      </div>
    </Field>);

}