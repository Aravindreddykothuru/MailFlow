import React from 'react';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = 'Failed to load data',
  description = 'Something went wrong. Please try again.',
  onRetry,
  isRetrying = false
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center px-6 py-16 text-center">
      
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg"
        aria-hidden="true">
        
        <AlertCircleIcon className="h-6 w-6 text-danger" />
      </div>
      <p className="mb-1 text-sm font-medium text-ink">{title}</p>
      <p className="mb-5 max-w-sm text-sm text-ink-muted">{description}</p>
      {onRetry &&
      <Button
        variant="secondary"
        size="sm"
        onClick={onRetry}
        isLoading={isRetrying}
        loadingText="Retrying…"
        leadingIcon={<RefreshCwIcon className="h-3.5 w-3.5" aria-hidden="true" />}
        className="text-primary">
        
          Retry
        </Button>
      }
    </div>);

}