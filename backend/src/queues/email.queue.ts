import { Queue } from 'bullmq';
import { createQueueConnection } from '../db/redis';

// ─── Job payload ─────────────────────────────────────────────────────────────
// Everything the worker needs is embedded in the job data so it doesn't need
// to re-query Postgres for the hot path. The DB row is still the source of
// truth; job data is a snapshot at enqueue time.

export interface EmailJobData {
  /** Matches ScheduledEmail.id — used as jobId for idempotency. */
  emailId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderId: string;
  etherealUser: string;
  etherealPass: string;
  /** ISO string — used by the worker for logging. */
  scheduledAt: string;
}

// ─── Queue singleton ──────────────────────────────────────────────────────────
// One queue instance shared across the app. BullMQ will refuse to add a job
// with a duplicate jobId (same UUID as the DB row) — this is the primary
// idempotency guard that prevents double-sending on reconcile or retry.

export const emailQueue = new Queue<EmailJobData>('email-dispatch', {
  connection: createQueueConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5_000,
    },
    // Jobs are not removed after completion so we have a BullMQ-level audit trail.
    removeOnComplete: { age: 60 * 60 * 24 }, // Keep for 24 h
    removeOnFail: { age: 60 * 60 * 24 * 7 }, // Keep failures for 7 days
  },
});
