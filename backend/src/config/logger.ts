import pino from 'pino';
import { isDev } from '../config';

// ─── Logger ──────────────────────────────────────────────────────────────────
// Structured JSON logs in production; human-readable pretty-print in dev.
// Every worker lifecycle event (queued → active → sent / failed) goes through
// child loggers derived from this instance so all logs carry a consistent shape.

export const logger = pino(
  {
    level: isDev ? 'debug' : 'info',
    base: { service: 'mailflow-backend' },
  },
  isDev
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname,service',
        },
      })
    : undefined,
);
