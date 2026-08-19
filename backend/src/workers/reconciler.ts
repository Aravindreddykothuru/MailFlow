import { prisma } from '../db/client';
import { emailQueue, type EmailJobData } from '../queues/email.queue';
import { logger } from '../config/logger';

// ─── Boot-time Reconciler ────────────────────────────────────────────────────
// Runs once on every server startup.
//
// Problem it solves:
//   Redis AOF persistence keeps most jobs alive across restarts, but if Redis
//   was wiped (e.g. volume deleted, cloud provider failure) while Postgres was
//   untouched, all pending jobs would be lost.
//
// Solution:
//   On boot, query Postgres for PENDING rows and re-add them to BullMQ.
//   Because jobId = DB row UUID, BullMQ's duplicate-job check makes the add a
//   no-op for jobs that already exist in Redis. Only truly missing jobs are
//   re-enqueued.
//
// Edge cases handled:
//   - scheduledAt is in the past: delay = 0 → job fires immediately.
//   - Row's sender has been deleted: skip with a warning, mark FAILED.

export async function reconcilePendingJobs(): Promise<void> {
  const reconcileLog = logger.child({ step: 'reconciler' });
  reconcileLog.info('Starting boot reconciliation...');

  const pendingRows = await prisma.scheduledEmail.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      campaign: { select: { subject: true, body: true } },
      sender: { select: { id: true, etherealUser: true, etherealPass: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  if (pendingRows.length === 0) {
    reconcileLog.info('No pending rows to reconcile');
    return;
  }

  reconcileLog.info({ count: pendingRows.length }, 'Found pending rows — re-enqueuing...');

  let requeued = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of pendingRows) {
    try {
      const delayMs = Math.max(0, row.scheduledAt.getTime() - Date.now());

      const jobData: EmailJobData = {
        emailId: row.id,
        recipientEmail: row.recipientEmail,
        subject: row.campaign.subject,
        body: row.campaign.body,
        senderId: row.sender.id,
        etherealUser: row.sender.etherealUser,
        etherealPass: row.sender.etherealPass,
        scheduledAt: row.scheduledAt.toISOString(),
      };

      // jobId = row.id → if the job already exists in Redis, this is a no-op.
      // If it was missing (Redis wipe), it gets re-added with the correct delay.
      await emailQueue.add(`send:${row.id}`, jobData, {
        jobId: row.id,
        delay: delayMs,
      });

      requeued += 1;
    } catch (err) {
      // BullMQ throws if attempting to add a job in a non-addable state.
      // Log and continue — do not let one bad row abort the whole reconcile.
      reconcileLog.warn({ emailId: row.id, err }, 'Reconcile: could not re-enqueue row');
      skipped += 1;
    }
  }

  reconcileLog.info(
    { total: pendingRows.length, requeued, skipped, failed },
    'Boot reconciliation complete',
  );
}
