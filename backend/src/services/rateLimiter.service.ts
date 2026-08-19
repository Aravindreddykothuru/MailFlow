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
}

/**
 * Atomically increments the sender's hourly send counter and checks whether
 * the send is within the configured limit.
 *
 * If the limit is exceeded: returns allowed=false and nextWindowMs so the
 * worker can reschedule the job to the next hour boundary rather than dropping
 * or failing it.
 *
 * If allowed: returns allowed=true. The counter has already been incremented,
 * so the caller must proceed with the send (do not call twice without sending).
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
    // (Decrementing is best-effort — a crash here leaves the counter 1 high,
    // which is acceptable: the job will be rescheduled, not dropped.)
    await redis.decr(key).catch(() => undefined);

    const nextWindowMs = msUntilNextHour();

    logger.warn(
      { senderId, count, maxPerHour, nextWindowMs },
      'Rate limit exceeded — job will be rescheduled to next hour',
    );

    return { allowed: false, nextWindowMs };
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

/** Milliseconds from now until the top of the next UTC hour. */
function msUntilNextHour(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next.getTime() - now.getTime();
}
