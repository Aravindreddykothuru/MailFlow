import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../config/logger';

// ─── Redis clients ────────────────────────────────────────────────────────────
// BullMQ requires separate client instances for the Queue and the Worker
// because ioredis connections enter blocking mode when used for Pub/Sub
// (which BullMQ uses internally for job events).
//
// We export factory functions so callers create their own connections:
//   - queueConnection  → used by Queue (non-blocking)
//   - workerConnection → used by Worker (may block on BRPOPLPUSH)
//   - defaultRedis     → used by rate-limit counters and reconciler checks

function createRedisClient(label: string): Redis {
  const client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,    // Reduces latency on connection
    lazyConnect: false,
  });

  client.on('connect', () => logger.info({ redis: label }, 'Redis connected'));
  client.on('error', (err) =>
    logger.error({ redis: label, err }, 'Redis connection error'),
  );

  return client;
}

/** General-purpose Redis client for rate-limit counters and ad-hoc commands. */
export const redis = createRedisClient('default');

/** Dedicated connection for BullMQ Queue instances. */
export function createQueueConnection(): Redis {
  return createRedisClient('queue');
}

/** Dedicated connection for BullMQ Worker instances. */
export function createWorkerConnection(): Redis {
  return createRedisClient('worker');
}
