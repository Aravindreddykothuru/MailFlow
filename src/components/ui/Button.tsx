import React from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border border-transparent',
  secondary: 'bg-white text-ink-muted border border-line hover:bg-gray-50 hover:text-ink',
  ghost: 'bg-transparent text-ink-muted border border-transparent hover:bg-gray-50 hover:text-ink',
  danger: 'bg-white text-danger border border-danger-border hover:bg-danger-bg'
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2.5'
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-semibold transition-colors duration-150 ease-out',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}>
      
      {isLoading ? <Spinner /> : leadingIcon}
      <span className="truncate">{isLoading ? loadingText ?? children : children}</span>
      {!isLoading && trailingIcon}
    </button>);

}