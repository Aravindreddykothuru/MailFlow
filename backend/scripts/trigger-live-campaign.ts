import '../src/config';
import { prisma } from '../src/db/client';
import { scheduleEmailBatch } from '../src/services/scheduling.service';

async function main() {
  console.log('Finding test user...');
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found');
    process.exit(1);
  }

  console.log('Scheduling campaign for user:', user.email);
  const result = await scheduleEmailBatch({
    userId: user.id,
    subject: 'MailFlow Live Inbox Delivery Test — ' + new Date().toLocaleTimeString(),
    body: '<h2>Congratulations!</h2><p>This is a live email scheduled through the ReachInbox MailFlow scheduler and dispatched via your Gmail account.</p>',
    recipients: ['aravindreddy8189@gmail.com'],
    startAt: new Date(Date.now() + 1000).toISOString(),
    delayMs: 1000,
    hourlyLimit: 50,
  });

  console.log('Campaign schedule result:', result);
  console.log('Waiting 8 seconds for BullMQ worker to process...');
  await new Promise((r) => setTimeout(r, 8000));

  const sent = await prisma.scheduledEmail.findFirst({
    where: { recipientEmail: 'aravindreddy8189@gmail.com' },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Processed email record in DB:', sent);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
