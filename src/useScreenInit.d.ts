export interface ScreenInitState {
  authenticated?: boolean;
  authStatus?: 'unauthenticated' | 'authenticating' | 'authenticated' | 'error' | 'loading';
  [key: string]: unknown;
}

export function useScreenInit(): ScreenInitState;
