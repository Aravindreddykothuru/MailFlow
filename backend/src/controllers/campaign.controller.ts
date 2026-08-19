import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scheduleEmailBatch } from '../services/scheduling.service';
import { logger } from '../config/logger';

// ─── Validation Schema ────────────────────────────────────────────────────────
// Matches the frontend's ScheduleRequest type + backend-only fields.
// senderId is intentionally omitted — auto-resolved to the user's default sender.

const scheduleSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  body: z.string().min(1, 'Body is required'),
  recipients: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one recipient is required'),
  startAt: z.string().datetime({ message: 'startAt must be a valid ISO 8601 datetime' }),
  delaySeconds: z.number().int().min(1, 'delaySeconds must be at least 1'),
  hourlyLimit: z.number().int().min(1, 'hourlyLimit must be at least 1'),
});

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * POST /campaigns/schedule
 *
 * Creates a campaign, fans out ScheduledEmail rows, and enqueues BullMQ jobs.
 * Returns the ScheduleResponse shape expected by the frontend.
 */
export async function scheduleCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = scheduleSchema.parse(req.body);

    const result = await scheduleEmailBatch({
      userId: req.userId,
      subject: body.subject,
      body: body.body,
      recipients: body.recipients,
      startAt: body.startAt,
      delayMs: body.delaySeconds * 1000,
      hourlyLimit: body.hourlyLimit,
    });

    logger.info(
      { userId: req.userId, batchId: result.batchId, count: result.scheduledCount },
      'Campaign schedule request processed',
    );

    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}
