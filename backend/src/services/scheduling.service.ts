import { prisma } from '../db/client';
import { emailQueue, type EmailJobData } from '../queues/email.queue';
import { logger } from '../config/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScheduleBatchParams {
  userId: string;
  subject: string;
  body: string;
  recipients: string[];
  /** ISO 8601 string — when the first email should fire. */
  startAt: string;
  /** Milliseconds between consecutive emails. */
  delayMs: number;
  /** Max emails per sender per hour. */
  hourlyLimit: number;
}

export interface ScheduleBatchResult {
  batchId: string;
  scheduledCount: number;
  firstSendAt: string;
  estimatedCompletionAt: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Creates a Campaign, fans out one ScheduledEmail row per recipient,
 * and enqueues a BullMQ delayed job for each row.
 *
 * Key guarantees:
 *  - jobId == DB row UUID → BullMQ silently ignores duplicate adds (idempotent).
 *  - Hourly window overflow: recipients that would exceed hourlyLimit are pushed
 *    to the next hour boundary so no email is ever dropped.
 *  - All DB writes happen before any queue adds so a crash between the two
 *    is healed by the reconciler on next boot.
 */
export async function scheduleEmailBatch(
  params: ScheduleBatchParams,
): Promise<ScheduleBatchResult> {
  const { userId, subject, body, recipients, startAt, delayMs, hourlyLimit } = params;

  const startMs = new Date(startAt).getTime();
  const now = Date.now();

  if (startMs <= now) {
    throw new Error('startAt must be in the future');
  }

  // ── Step 1: Resolve the default sender for this user ─────────────────────
  const sender = await prisma.sender.findFirst({ where: { userId } });
  if (!sender) {
    throw new Error(
      'No sender configured for this account. Please contact support.',
    );
  }

  // ── Step 2: Create the Campaign row ──────────────────────────────────────
  const campaign = await prisma.campaign.create({
    data: { userId, subject, body },
  });

  // ── Step 3: Compute scheduledAt per recipient (respecting hourly cap) ─────
  const rows: {
    id?: string; // assigned after createMany
    campaignId: string;
    senderId: string;
    recipientEmail: string;
    scheduledAt: Date;
  }[] = [];

  let hourWindowStart = startMs;
  let countInCurrentHour = 0;

  for (let i = 0; i < recipients.length; i++) {
    if (countInCurrentHour >= hourlyLimit) {
      // Push remaining sends to the start of the next hour window.
      hourWindowStart = nextHourBoundary(hourWindowStart);
      countInCurrentHour = 0;
    }

    // Base scheduled time: start of current hour window + cumulative per-send delay.
    const scheduledAt = new Date(
      hourWindowStart + countInCurrentHour * delayMs,
    );

    rows.push({
      campaignId: campaign.id,
      senderId: sender.id,
      recipientEmail: recipients[i],
      scheduledAt,
    });

    countInCurrentHour += 1;
  }

  // ── Step 4: Bulk-insert all ScheduledEmail rows ───────────────────────────
  // createMany doesn't return ids in all Prisma/Postgres versions, so we
  // insert then immediately query to get the UUIDs we need for jobIds.
  await prisma.scheduledEmail.createMany({ data: rows });

  const inserted = await prisma.scheduledEmail.findMany({
    where: { campaignId: campaign.id },
    select: {
      id: true,
      recipientEmail: true,
      scheduledAt: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  // ── Step 5: Enqueue one BullMQ delayed job per row ────────────────────────
  // jobId = DB row UUID → duplicate add is a no-op (idempotency).
  const jobs = inserted.map((row) => {
    const jobData: EmailJobData = {
      emailId: row.id,
      recipientEmail: row.recipientEmail,
      subject,
      body,
      senderId: sender.id,
      etherealUser: sender.etherealUser,
      etherealPass: sender.etherealPass,
      scheduledAt: row.scheduledAt.toISOString(),
    };

    const delayUntilSend = Math.max(0, row.scheduledAt.getTime() - Date.now());

    return emailQueue.add(`send:${row.id}`, jobData, {
      jobId: row.id,
      delay: delayUntilSend,
    });
  });

  await Promise.all(jobs);

  logger.info(
    {
      campaignId: campaign.id,
      userId,
      recipientCount: inserted.length,
      firstSendAt: inserted[0]?.scheduledAt,
    },
    'Campaign scheduled — jobs enqueued',
  );

  const firstSendAt = inserted[0]?.scheduledAt ?? new Date();
  const lastSendAt = inserted[inserted.length - 1]?.scheduledAt ?? new Date();

  return {
    batchId: campaign.id,
    scheduledCount: inserted.length,
    firstSendAt: firstSendAt.toISOString(),
    estimatedCompletionAt: lastSendAt.toISOString(),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the Unix timestamp (ms) of the top of the next hour after `fromMs`.
 * Used to push overflow recipients beyond the hourly rate cap.
 */
function nextHourBoundary(fromMs: number): number {
  const d = new Date(fromMs);
  d.setUTCMinutes(0, 0, 0);
  d.setUTCHours(d.getUTCHours() + 1);
  return d.getTime();
}
