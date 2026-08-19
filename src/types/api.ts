export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorShape;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface ApiErrorShape {
  code: string;
  message: string;
  status?: number;
}

/** Thrown by every service function so callers only handle one error type. */
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor({ code, message, status }: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export type ResourceStatus = 'loading' | 'success' | 'empty' | 'error';