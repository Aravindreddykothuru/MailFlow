import { redis } from '../db/redis';
import { logger } from '../config/logger';

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// Uses Redis INCR + EXPIRE to track how many emails a sender has dispatched
// within the current UTC-hour window.
//
// Key design: the counter lives in Redis (not in-process memory) so multiple
// worker instances or pods all share the same rate state — a critical
// correctness requirement.
//
// Key pattern: rate:{senderId}:{YYYY-MM-DDTHH}  (UTC hour bucket)
// Example:     rate:sender_abc:2024-10-24T09

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the next hour window opens. Only set when allowed=false. */
  nextWindowMs?: number;
  /** Unix timestamp (ms) of the start of the next hour window. Only set when allowed=false. */
  nextHourTimestamp?: number;
}

/**
 * Atomically increments the sender's hourly send counter and checks whether
 * the send is within the configured limit.
 *
 * If the limit is exceeded: returns allowed=false and nextHourTimestamp so the
 * worker can reschedule the job to the next hour boundary via job.moveToDelayed().
 *
 * If allowed: returns allowed=true. The counter has already been incremented,
 * so the caller must proceed with the send.
 */
export async function checkAndIncrement(
  senderId: string,
  maxPerHour: number,
): Promise<RateLimitResult> {
  const key = buildRateKey(senderId);

  // INCR is atomic — safe with multiple concurrent workers.
  const count = await redis.incr(key);

  // Set TTL on first write only (INCR creates the key if missing).
  if (count === 1) {
    await redis.expire(key, 3600);
  }

  if (count > maxPerHour) {
    // Undo the increment so the count is accurate when the window resets.
    await redis.decr(key).catch(() => undefined);

    const nextHourTimestamp = getNextHourTimestamp();
    const nextWindowMs = Math.max(0, nextHourTimestamp - Date.now());

    logger.warn(
      { senderId, count, maxPerHour, nextWindowMs, nextHourTimestamp },
      'Rate limit exceeded — job will be rescheduled to next hour',
    );

    return { allowed: false, nextWindowMs, nextHourTimestamp };
  }

  return { allowed: true };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Builds the Redis key for the current UTC hour bucket. */
function buildRateKey(senderId: string): string {
  const now = new Date();
  const bucket = now.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
  return `rate:${senderId}:${bucket}`;
}

/** Returns the Unix timestamp (ms) at the top of the next UTC hour. */
export function getNextHourTimestamp(): number {
  const next = new Date();
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next.getTime();
}
