import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scheduleEmailBatch } from '../services/scheduling.service';
import { logger } from '../config/logger';

// ─── Validation Schema ────────────────────────────────────────────────────────
// Accepts standard field names and common aliases (startTime/startAt, delayMs/delaySeconds, optional senderId)

const scheduleSchema = z
  .object({
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(1, 'Body is required'),
    recipients: z
      .array(z.string().email('Invalid email address'))
      .min(1, 'At least one recipient is required'),
    startAt: z.string().optional(),
    startTime: z.string().optional(),
    delaySeconds: z.number().int().positive().optional(),
    delayMs: z.number().int().positive().optional(),
    hourlyLimit: z.number().int().positive().default(50),
    senderId: z.string().optional(),
  })
  .refine((data) => Boolean(data.startAt || data.startTime), {
    message: 'Either startAt or startTime (ISO 8601 datetime) is required',
    path: ['startAt'],
  })
  .refine((data) => data.delaySeconds !== undefined || data.delayMs !== undefined, {
    message: 'Either delaySeconds or delayMs is required',
    path: ['delaySeconds'],
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
    const raw = scheduleSchema.parse(req.body);

    const startAt = raw.startAt ?? raw.startTime!;
    const delayMs = raw.delayMs ?? (raw.delaySeconds! * 1000);

    const result = await scheduleEmailBatch({
      userId: req.userId,
      senderId: raw.senderId,
      subject: raw.subject,
      body: raw.body,
      recipients: raw.recipients,
      startAt,
      delayMs,
      hourlyLimit: raw.hourlyLimit,
    });

    logger.info(
      { userId: req.userId, batchId: result.batchId, count: result.scheduledCount, senderId: raw.senderId },
      'Campaign schedule request processed',
    );

    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}
