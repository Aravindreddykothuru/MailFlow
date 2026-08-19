import './config'; // Validates env vars first — exits if invalid
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import { config } from './config';
import { logger } from './config/logger';
import { prisma } from './db/client';

import { configureGoogleStrategy, getMe } from './controllers/auth.controller';
import { authRouter } from './routes/auth.routes';
import { campaignRouter } from './routes/campaign.routes';
import { emailRouter } from './routes/email.routes';
import { requireAuth } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';

import { emailQueue } from './queues/email.queue';
import { createEmailWorker } from './workers/email.worker';
import { reconcilePendingJobs } from './workers/reconciler';

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow the frontend origin with credentials so httpOnly cookies are sent
// cross-origin. In production, restrict to the exact frontend domain.
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Passport (stateless — no session) ────────────────────────────────────────
configureGoogleStrategy();
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/campaigns', campaignRouter);
app.use('/emails', emailRouter);
app.get('/me', requireAuth, getMe);


// Health check — useful for Docker and load-balancer probes.
app.get('/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'healthy', ts: new Date().toISOString() } });
});

// ── Global error handler (must be last middleware) ────────────────────────────
app.use(errorHandler);

// ─── Boot Sequence ────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  try {
    // 1. Verify Postgres connection
    await prisma.$connect();
    logger.info('PostgreSQL connected');

    // 2. Start the BullMQ worker
    const worker = createEmailWorker();
    logger.info(
      { concurrency: config.WORKER_CONCURRENCY, minDelayMs: config.MIN_DELAY_MS },
      'Email worker started',
    );

    // 3. Reconcile any PENDING jobs that may have been lost from Redis
    //    (no-op if Redis is healthy; self-heals if Redis was wiped).
    await reconcilePendingJobs();

    // 4. Start HTTP server
    const server = app.listen(config.PORT, () => {
      logger.info({ port: config.PORT }, `Server listening`);
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    // On SIGTERM/SIGINT: drain the worker, close Postgres, stop the HTTP server.
    async function shutdown(signal: string): Promise<void> {
      logger.info({ signal }, 'Shutting down gracefully...');

      server.close(() => logger.info('HTTP server closed'));

      await worker.close();
      logger.info('Worker closed');

      await emailQueue.close();
      logger.info('Queue closed');

      await prisma.$disconnect();
      logger.info('Prisma disconnected');

      process.exit(0);
    }

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Boot failed — exiting');
    process.exit(1);
  }
}

void boot();
