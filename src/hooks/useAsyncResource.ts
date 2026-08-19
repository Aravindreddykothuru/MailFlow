import { useCallback, useEffect, useState } from 'react';
import { ApiError, type ResourceStatus } from '../types/api';

export interface AsyncResource<T> {
  data: T | null;
  status: ResourceStatus;
  error: string | null;
  reload: () => void;
}

/**
 * Drives the loading / empty / error / success states every data screen shows.
 * `loader` must be referentially stable (a module-level service function).
 */
export function useAsyncResource<T>(
loader: (signal?: AbortSignal) => Promise<T>,
isEmpty: (data: T) => boolean)
: AsyncResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setStatus('loading');
    setError(null);

    loader(controller.signal).
    then((result) => {
      if (!active) return;
      setData(result);
      setStatus(isEmpty(result) ? 'empty' : 'success');
    }).
    catch((caught: unknown) => {
      if (!active || controller.signal.aborted) return;
      setError(
        caught instanceof ApiError ? caught.message : 'Something went wrong. Please try again.'
      );
      setStatus('error');
    });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, status, error, reload };
}