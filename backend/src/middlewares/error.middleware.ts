import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered last in the middleware chain (after all routes).
// All errors thrown or passed to next(err) land here.
//
// Response envelope shape matches the frontend's ApiFailure type:
//   { ok: false, error: { code, message, status? } }

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Zod validation errors (bad request bodies)
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    res.status(400).json({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message, status: 400 },
    });
    return;
  }

  // Known application errors (thrown with a status property)
  if (isAppError(err)) {
    res.status(err.status).json({
      ok: false,
      error: { code: err.code, message: err.message, status: err.status },
    });
    return;
  }

  // Unexpected errors — log and return a generic 500
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      status: 500,
    },
  });
}

// ─── Application Error ────────────────────────────────────────────────────────

export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
