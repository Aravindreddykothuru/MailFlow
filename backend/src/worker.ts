import './config';
import { config } from './config';
import { logger } from './config/logger';
import { prisma } from './db/client';
import { createEmailWorker } from './workers/email.worker';
import { reconcilePendingJobs } from './workers/reconciler';
import { emailQueue } from './queues/email.queue';

async function startWorkerService(): Promise<void> {
  try {
    logger.info('Starting standalone BullMQ worker process...');

    // 1. Connect to PostgreSQL
    await prisma.$connect();
    logger.info('PostgreSQL connected');

    // 2. Start BullMQ Email Worker
    const worker = createEmailWorker();
    logger.info(
      { concurrency: config.WORKER_CONCURRENCY, minDelayMs: config.MIN_DELAY_MS },
      'Email worker initialized',
    );

    // 3. Reconcile pending jobs from PostgreSQL into BullMQ
    await reconcilePendingJobs();
    logger.info('Boot reconciliation complete — worker is actively listening for jobs');

    // 4. Graceful shutdown handler
    async function shutdown(signal: string): Promise<void> {
      logger.info({ signal }, 'Stopping worker gracefully...');
      await worker.close();
      await emailQueue.close();
      await prisma.$disconnect();
      logger.info('Worker shutdown complete');
      process.exit(0);
    }

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Worker startup failed');
    process.exit(1);
  }
}

void startWorkerService();
