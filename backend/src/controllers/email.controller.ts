import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { emailQueue } from '../queues/email.queue';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Maps the DB EmailStatus enum to the string values the frontend expects.
 * Frontend type: 'Scheduled' | 'Processing' | 'Sent' | 'Failed'
 *   PENDING → 'Scheduled'  (in transit)
 *   SENT    → 'Sent'
 *   FAILED  → 'Failed'
 */
function mapStatus(status: string): 'Scheduled' | 'Sent' | 'Failed' {
  if (status === 'SENT') return 'Sent';
  if (status === 'FAILED') return 'Failed';
  return 'Scheduled';
}

/**
 * Derives a display name from an email address local part.
 * "john.doe@example.com" → "John Doe"
 * Satisfies the frontend SentEmail.recipientName field without storing a separate name column.
 */
function recipientNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// Pagination and filter query schema
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
});

// ─── GET /emails/scheduled ────────────────────────────────────────────────────

export async function getScheduledEmails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, status } = querySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const whereClause: {
      campaign: { userId: string };
      status?: 'PENDING' | 'SENT' | 'FAILED';
    } = {
      campaign: { userId: req.userId },
      status: 'PENDING',
    };

    if (status && status.toUpperCase() === 'FAILED') {
      whereClause.status = 'FAILED';
    }

    const [rows, total] = await Promise.all([
      prisma.scheduledEmail.findMany({
        where: whereClause,
        select: {
          id: true,
          recipientEmail: true,
          scheduledAt: true,
          status: true,
          campaign: { select: { subject: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.scheduledEmail.count({
        where: whereClause,
      }),
    ]);

    // Shape matches the frontend ScheduledEmail type exactly.
    const data = rows.map((row) => ({
      id: row.id,
      email: row.recipientEmail,
      subject: row.campaign.subject,
      scheduledAt: row.scheduledAt.toISOString(),
      status: mapStatus(row.status),
    }));

    res.json({
      ok: true,
      data,
      meta: { page, limit, total, pageCount: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /emails/sent ─────────────────────────────────────────────────────────

export async function getSentEmails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, status } = querySchema.parse(req.query);
    const skip = (page - 1) * limit;

    let statusCondition: { in: ('SENT' | 'FAILED')[] } | 'SENT' | 'FAILED' = {
      in: ['SENT', 'FAILED'],
    };

    if (status) {
      const upper = status.toUpperCase();
      if (upper === 'SENT') statusCondition = 'SENT';
      else if (upper === 'FAILED') statusCondition = 'FAILED';
    }

    const whereClause = {
      campaign: { userId: req.userId },
      status: statusCondition,
    };

    const [rows, total] = await Promise.all([
      prisma.scheduledEmail.findMany({
        where: whereClause,
        select: {
          id: true,
          recipientEmail: true,
          sentAt: true,
          status: true,
          errorMessage: true,
          campaign: { select: { subject: true } },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.scheduledEmail.count({
        where: whereClause,
      }),
    ]);

    // Shape matches the frontend SentEmail type exactly.
    const data = rows.map((row) => ({
      id: row.id,
      email: row.recipientEmail,
      recipientName: recipientNameFromEmail(row.recipientEmail),
      subject: row.campaign.subject,
      sentAt: (row.sentAt ?? new Date()).toISOString(),
      status: mapStatus(row.status),
      ...(row.errorMessage ? { failureReason: row.errorMessage } : {}),
    }));

    res.json({
      ok: true,
      data,
      meta: { page, limit, total, pageCount: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /emails/scheduled/:id ────────────────────────────────────────────

export async function cancelScheduledEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    // Verify the row belongs to the requesting user.
    const row = await prisma.scheduledEmail.findFirst({
      where: { id, campaign: { userId: req.userId }, status: 'PENDING' },
      select: { id: true },
    });

    if (!row) {
      throw new AppError(
        'EMAIL_NOT_FOUND',
        'Scheduled email not found or already sent/cancelled.',
        404,
      );
    }

    // Mark as FAILED in the DB (there's no 'cancelled' status — FAILED surfaces
    // in the sent tab so the user can see it was deliberately stopped).
    await prisma.scheduledEmail.update({
      where: { id },
      data: { status: 'FAILED', errorMessage: 'Cancelled by user' },
    });

    // Remove the BullMQ job. If the job has already fired (race condition),
    // remove() resolves without error — safe to call unconditionally.
    try {
      const job = await emailQueue.getJob(id);
      if (job) await job.remove();
    } catch (qErr) {
      // Non-fatal: the DB status is already updated. Log and continue.
      logger.warn({ emailId: id, err: qErr }, 'Could not remove BullMQ job during cancel');
    }

    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}
