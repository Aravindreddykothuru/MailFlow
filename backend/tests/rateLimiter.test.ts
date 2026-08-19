import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Unit tests for the Redis-backed rate limiter ────────────────────────────
// These tests mock ioredis so they run without a real Redis instance.

vi.mock('../src/db/redis', () => ({
  redis: {
    incr: vi.fn(),
    decr: vi.fn(),
    expire: vi.fn(),
  },
}));

vi.mock('../src/config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Must be imported AFTER mocks are defined.
const { redis } = await import('../src/db/redis');
const { checkAndIncrement } = await import('../src/services/rateLimiter.service');

describe('rateLimiter.service — checkAndIncrement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns allowed=true when count is within limit', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.expire).mockResolvedValue(1);

    const result = await checkAndIncrement('sender-1', 50);

    expect(result.allowed).toBe(true);
    expect(result.nextWindowMs).toBeUndefined();
    expect(redis.incr).toHaveBeenCalledOnce();
    // EXPIRE is set when count === 1 (first write to the bucket)
    expect(redis.expire).toHaveBeenCalledWith(expect.stringContaining('sender-1'), 3600);
  });

  it('returns allowed=true when count equals exactly the limit', async () => {
    vi.mocked(redis.incr).mockResolvedValue(50);
    vi.mocked(redis.expire).mockResolvedValue(1);

    const result = await checkAndIncrement('sender-1', 50);

    expect(result.allowed).toBe(true);
  });

  it('returns allowed=false and nextWindowMs when limit is exceeded', async () => {
    vi.mocked(redis.incr).mockResolvedValue(51);
    vi.mocked(redis.decr).mockResolvedValue(50);
    vi.mocked(redis.expire).mockResolvedValue(1);

    const result = await checkAndIncrement('sender-1', 50);

    expect(result.allowed).toBe(false);
    expect(result.nextWindowMs).toBeGreaterThan(0);
    // Decrements so the count remains accurate
    expect(redis.decr).toHaveBeenCalledOnce();
  });

  it('does NOT call expire when the key already exists (count > 1)', async () => {
    vi.mocked(redis.incr).mockResolvedValue(10);

    await checkAndIncrement('sender-2', 50);

    expect(redis.expire).not.toHaveBeenCalled();
  });

  it('uses a key that includes the senderId and current UTC hour', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.expire).mockResolvedValue(1);

    await checkAndIncrement('my-sender', 10);

    const calledKey = vi.mocked(redis.incr).mock.calls[0][0];
    expect(calledKey).toMatch(/^rate:my-sender:\d{4}-\d{2}-\d{2}T\d{2}$/);
  });
});
