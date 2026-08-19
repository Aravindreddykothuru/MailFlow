import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Unit tests for the scheduling service ────────────────────────────────────
// Tests the hourly-cap overflow logic without touching Postgres or Redis.

// Mock all external dependencies
vi.mock('../src/db/client', () => ({
  prisma: {
    sender: { findFirst: vi.fn() },
    campaign: { create: vi.fn() },
    scheduledEmail: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../src/queues/email.queue', () => ({
  emailQueue: { add: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../src/config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })) },
}));

const { prisma } = await import('../src/db/client');
const { scheduleEmailBatch } = await import('../src/services/scheduling.service');
const { emailQueue } = await import('../src/queues/email.queue');

const SENDER = {
  id: 'sender-1',
  etherealUser: 'test@ethereal.email',
  etherealPass: 'testpass',
  email: 'sender@test.com',
  displayName: 'Test Sender',
  userId: 'user-1',
};

const CAMPAIGN = { id: 'campaign-1' };

describe('scheduling.service — scheduleEmailBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.sender.findFirst).mockResolvedValue(SENDER);
    vi.mocked(prisma.campaign.create).mockResolvedValue({ ...CAMPAIGN, userId: 'user-1', subject: 'Test', body: 'Body', createdAt: new Date() });
    vi.mocked(prisma.scheduledEmail.createMany).mockResolvedValue({ count: 0 });
  });

  it('schedules N recipients with correct delays', async () => {
    const recipients = ['a@x.com', 'b@x.com', 'c@x.com'];
    const startAt = new Date(Date.now() + 60_000).toISOString();

    const rows = recipients.map((email, i) => ({
      id: `row-${i}`,
      recipientEmail: email,
      scheduledAt: new Date(Date.now() + 60_000 + i * 30_000),
    }));

    vi.mocked(prisma.scheduledEmail.findMany).mockResolvedValue(rows);

    const result = await scheduleEmailBatch({
      userId: 'user-1',
      subject: 'Test',
      body: 'Body',
      recipients,
      startAt,
      delayMs: 30_000,
      hourlyLimit: 100,
    });

    expect(result.scheduledCount).toBe(3);
    expect(emailQueue.add).toHaveBeenCalledTimes(3);
  });

  it('pushes overflow recipients to the next hour when hourlyLimit is exceeded', async () => {
    // 3 recipients with hourlyLimit=2 → 2 in hour 0, 1 in hour 1
    const recipients = ['a@x.com', 'b@x.com', 'c@x.com'];
    const startAt = new Date(Date.now() + 60_000).toISOString();

    // The service computes scheduledAt internally; we just verify createMany
    // received rows with the overflow recipient pushed to the next hour.
    vi.mocked(prisma.scheduledEmail.findMany).mockResolvedValue(
      recipients.map((email, i) => ({
        id: `row-${i}`,
        recipientEmail: email,
        scheduledAt: new Date(Date.now() + 60_000 + i * 15_000),
      }))
    );

    await scheduleEmailBatch({
      userId: 'user-1',
      subject: 'Test',
      body: 'Body',
      recipients,
      startAt,
      delayMs: 15_000,
      hourlyLimit: 2,
    });

    const createManyCall = vi.mocked(prisma.scheduledEmail.createMany).mock.calls[0][0];
    const data = (createManyCall as { data: { scheduledAt: Date; recipientEmail: string }[] }).data;

    // Row 0 and 1 are in hour 0; row 2 should be at the start of the next UTC hour
    const row0 = data[0].scheduledAt;
    const row2 = data[2].scheduledAt;

    expect(row2.getTime()).toBeGreaterThan(row0.getTime());
    expect(row2.getUTCMinutes()).toBe(0);
    expect(row2.getUTCSeconds()).toBe(0);
    expect(row2.getUTCHours()).toBe((row0.getUTCHours() + 1) % 24);
  });


  it('throws if startAt is in the past', async () => {
    await expect(
      scheduleEmailBatch({
        userId: 'user-1',
        subject: 'Test',
        body: 'Body',
        recipients: ['a@x.com'],
        startAt: new Date(Date.now() - 1000).toISOString(),
        delayMs: 15_000,
        hourlyLimit: 50,
      })
    ).rejects.toThrow('startAt must be in the future');
  });

  it('throws if no sender is configured for the user', async () => {
    vi.mocked(prisma.sender.findFirst).mockResolvedValue(null);

    await expect(
      scheduleEmailBatch({
        userId: 'user-1',
        subject: 'Test',
        body: 'Body',
        recipients: ['a@x.com'],
        startAt: new Date(Date.now() + 60_000).toISOString(),
        delayMs: 15_000,
        hourlyLimit: 50,
      })
    ).rejects.toThrow('No sender configured');
  });
});
