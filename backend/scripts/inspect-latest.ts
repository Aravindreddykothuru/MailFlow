import '../src/config';
import { prisma } from '../src/db/client';

async function main() {
  const emails = await prisma.scheduledEmail.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { sender: true },
  });
  console.log(JSON.stringify(emails, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
