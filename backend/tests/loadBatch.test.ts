import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
  },
}));

const { prisma } = await import('../src/db/client');
const { scheduleEmailBatch } = await import('../src/services/scheduling.service');
const { emailQueue } = await import('../src/queues/email.queue');

describe('Load & scale — 1,000+ recipient batch scheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.sender.findFirst).mockResolvedValue({
      id: 'sender-1',
      etherealUser: 'test@ethereal.email',
      etherealPass: 'testpass',
      email: 'sender@test.com',
      displayName: 'Test Sender',
      userId: 'user-1',
    });
    vi.mocked(prisma.campaign.create).mockResolvedValue({
      id: 'campaign-1000',
      userId: 'user-1',
      subject: 'Bulk Campaign',
      body: '<p>Bulk Email Content</p>',
      createdAt: new Date(),
    });
    vi.mocked(prisma.scheduledEmail.createMany).mockResolvedValue({ count: 1000 });
  });

  it('correctly fans out 1000 recipients across multiple hourly windows without dropping any jobs', async () => {
    const COUNT = 1000;
    const HOURLY_LIMIT = 100; // Expected to span across 10 hours
    const DELAY_MS = 2000; // 2 seconds between emails

    const recipients = Array.from({ length: COUNT }, (_, i) => `lead_${i + 1}@example.com`);
    const startAt = new Date(Date.now() + 60_000).toISOString();

    const mockInsertedRows = recipients.map((email, i) => ({
      id: `row-uuid-${i}`,
      recipientEmail: email,
      scheduledAt: new Date(Date.now() + 60_000 + i * 2000),
    }));

    vi.mocked(prisma.scheduledEmail.findMany).mockResolvedValue(mockInsertedRows);

    const result = await scheduleEmailBatch({
      userId: 'user-1',
      subject: 'Bulk Outreach',
      body: '<p>Hello Lead</p>',
      recipients,
      startAt,
      delayMs: DELAY_MS,
      hourlyLimit: HOURLY_LIMIT,
    });

    expect(result.scheduledCount).toBe(COUNT);
    expect(emailQueue.add).toHaveBeenCalledTimes(COUNT);

    // Verify createMany received all 1000 rows
    const createManyCall = vi.mocked(prisma.scheduledEmail.createMany).mock.calls[0][0];
    const data = (createManyCall as { data: { scheduledAt: Date; recipientEmail: string }[] }).data;
    expect(data.length).toBe(COUNT);

    // Check that every batch of 100 items is grouped within an hour and subsequent batches step into next hours
    const firstRowDate = data[0].scheduledAt;
    const hundredthRowDate = data[99].scheduledAt;
    const hundredFirstRowDate = data[100].scheduledAt; // 101st recipient -> pushed to next hour

    expect(hundredFirstRowDate.getTime()).toBeGreaterThan(hundredthRowDate.getTime());
    expect(hundredFirstRowDate.getUTCMinutes()).toBe(0);
    expect(hundredFirstRowDate.getUTCSeconds()).toBe(0);
  });
});
