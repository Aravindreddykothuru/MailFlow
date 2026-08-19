import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../src/db/client', () => ({
  prisma: {
    scheduledEmail: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../src/queues/email.queue', () => ({
  emailQueue: {
    add: vi.fn().mockResolvedValue(undefined),
  },
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
const { emailQueue } = await import('../src/queues/email.queue');
const { reconcilePendingJobs } = await import('../src/workers/reconciler');

describe('reconciler — boot-time restart safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no-ops when there are no pending emails in DB', async () => {
    vi.mocked(prisma.scheduledEmail.findMany).mockResolvedValue([]);

    await reconcilePendingJobs();

    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it('re-enqueues all PENDING emails using their DB id as jobId for idempotency', async () => {
    const futureTime = new Date(Date.now() + 600_000);
    const pendingRows = [
      {
        id: 'email-uuid-1',
        recipientEmail: 'user1@example.com',
        scheduledAt: futureTime,
        status: 'PENDING' as const,
        campaign: { subject: 'Campaign 1', body: '<p>Hi</p>' },
        sender: { id: 'sender-1', etherealUser: 'eth1', etherealPass: 'pass1' },
      },
      {
        id: 'email-uuid-2',
        recipientEmail: 'user2@example.com',
        scheduledAt: new Date(Date.now() - 50_000), // in the past: should fire with delay=0
        status: 'PENDING' as const,
        campaign: { subject: 'Campaign 1', body: '<p>Hi</p>' },
        sender: { id: 'sender-1', etherealUser: 'eth1', etherealPass: 'pass1' },
      },
    ];

    vi.mocked(prisma.scheduledEmail.findMany).mockResolvedValue(pendingRows as any);

    await reconcilePendingJobs();

    expect(emailQueue.add).toHaveBeenCalledTimes(2);

    // Verify first job uses exact UUID as jobId
    expect(emailQueue.add).toHaveBeenNthCalledWith(
      1,
      'send:email-uuid-1',
      expect.objectContaining({
        emailId: 'email-uuid-1',
        recipientEmail: 'user1@example.com',
        subject: 'Campaign 1',
      }),
      expect.objectContaining({
        jobId: 'email-uuid-1',
      }),
    );

    // Verify second job (past scheduledAt) gets delay = 0
    expect(emailQueue.add).toHaveBeenNthCalledWith(
      2,
      'send:email-uuid-2',
      expect.objectContaining({
        emailId: 'email-uuid-2',
        recipientEmail: 'user2@example.com',
      }),
      expect.objectContaining({
        jobId: 'email-uuid-2',
        delay: 0,
      }),
    );
  });
});
