import '../src/config';
import { prisma } from '../src/db/client';
import { scheduleEmailBatch } from '../src/services/scheduling.service';
import { logger } from '../src/config/logger';

async function seed1000Emails() {
  console.log('🚀 Starting 1,000+ emails seeding test...');

  // 1. Find or create a test user
  let user = await prisma.user.findFirst({
    where: { email: 'loadtest@example.com' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'loadtest@example.com',
        name: 'Load Tester',
      },
    });
  }

  // 2. Find or create a test sender
  let sender = await prisma.sender.findFirst({
    where: { userId: user.id },
  });

  if (!sender) {
    sender = await prisma.sender.create({
      data: {
        userId: user.id,
        displayName: 'Load Test Sender',
        email: 'loadtest.sender@ethereal.email',
        etherealUser: 'loadtest.sender@ethereal.email',
        etherealPass: 'testpass123',
      },
    });
  }

  // 3. Generate 1000 recipient emails
  const COUNT = 1000;
  const recipients = Array.from({ length: COUNT }, (_, i) => `benchmark_lead_${i + 1}@example.com`);

  console.log(`📦 Generating and scheduling ${COUNT} emails in batches...`);
  const startTime = new Date(Date.now() + 60_000).toISOString(); // 1 min in future

  const result = await scheduleEmailBatch({
    userId: user.id,
    senderId: sender.id,
    subject: 'MailFlow 1000-Email Load Benchmark',
    body: '<h1>MailFlow Scale Verification</h1><p>Testing BullMQ throttler and rate limiter.</p>',
    recipients,
    startAt: startTime,
    delayMs: 2000, // 2 seconds between emails
    hourlyLimit: 50, // 50 emails per hour -> spans 20 hours
  });

  console.log('✅ 1,000+ Emails successfully scheduled and enqueued!');
  console.log('📊 Result summary:', {
    batchId: result.batchId,
    scheduledCount: result.scheduledCount,
    firstSendAt: result.firstSendAt,
    estimatedCompletionAt: result.estimatedCompletionAt,
  });

  await prisma.$disconnect();
}

seed1000Emails().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
