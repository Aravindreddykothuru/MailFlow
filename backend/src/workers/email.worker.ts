import { Worker, type Job } from 'bullmq';
import { prisma } from '../db/client';
import { config } from '../config';
import { logger } from '../config/logger';
import { createWorkerConnection } from '../db/redis';
import { type EmailJobData } from '../queues/email.queue';
import { checkAndIncrement } from '../services/rateLimiter.service';
import { sendViaEthereal } from '../services/sender.service';

// ─── Worker ──────────────────────────────────────────────────────────────────
// Processes jobs from the 'email-dispatch' queue.
//
// Concurrency model:
//  - concurrency: N   → up to N jobs run simultaneously
//  - limiter          → enforces a minimum gap of MIN_DELAY_MS between any two
//                       dispatches, even with high concurrency
//
// Idempotency guards (two layers):
//  1. BullMQ: jobId = DB row UUID → duplicate adds are no-ops
//  2. Worker: checks DB status before sending → skips non-PENDING rows
//             (handles the race where a job fires twice due to Redis AOF replay)

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { emailId, recipientEmail, subject, body, senderId, etherealUser, etherealPass } =
    job.data;

  const jobLog = logger.child({ jobId: job.id, emailId, recipientEmail });
  jobLog.info('Job active');

  // ── Guard 1: Verify the DB row is still PENDING ───────────────────────────
  const emailRow = await prisma.scheduledEmail.findUnique({
    where: { id: emailId },
    select: { id: true, status: true, sender: { select: { email: true, displayName: true } } },
  });

  if (!emailRow) {
    jobLog.warn('DB row not found — skipping job');
    return;
  }

  if (emailRow.status !== 'PENDING') {
    jobLog.info({ status: emailRow.status }, 'Row already processed — skipping (idempotency guard)');
    return;
  }

  // ── Guard 2: Redis-backed hourly rate limit ───────────────────────────────
  const rateResult = await checkAndIncrement(
    senderId,
    config.MAX_EMAILS_PER_HOUR_PER_SENDER,
  );

  if (!rateResult.allowed) {
    const nextWindowMs = rateResult.nextWindowMs ?? 60 * 60 * 1000;
    jobLog.warn({ nextWindowMs }, 'Rate limit exceeded — moving job to next hour window');

    // moveToDelayed pushes the job back into the delayed set rather than
    // failing it. The job retains its original jobId so it remains idempotent.
    await job.moveToDelayed(Date.now() + nextWindowMs, job.token);
    return;
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  try {
    const result = await sendViaEthereal({
      etherealUser,
      etherealPass,
      from: `${emailRow.sender.displayName} <${emailRow.sender.email}>`,
      to: recipientEmail,
      subject,
      html: body,
    });

    await prisma.scheduledEmail.update({
      where: { id: emailId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    jobLog.info(
      { messageId: result.messageId, previewUrl: result.previewUrl },
      'Email sent successfully',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jobLog.error({ err }, 'Email send failed');

    await prisma.scheduledEmail.update({
      where: { id: emailId },
      data: {
        status: 'FAILED',
        errorMessage: message,
      },
    });

    // Re-throw so BullMQ records the job as failed and applies retry backoff.
    throw err;
  }
}

// ─── Worker instance ──────────────────────────────────────────────────────────

export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>('email-dispatch', processEmailJob, {
    connection: createWorkerConnection(),
    concurrency: config.WORKER_CONCURRENCY,
    // Minimum gap between any two dispatches across all concurrent slots.
    // This is enforced by BullMQ at the queue level, not per-slot.
    limiter: {
      max: 1,
      duration: config.MIN_DELAY_MS,
    },
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Job failed');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'Job stalled — will be retried');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Worker error');
  });

  return worker;
}
