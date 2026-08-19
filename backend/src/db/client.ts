import { PrismaClient } from '@prisma/client';
import { isDev } from '../config';

// ─── Singleton ───────────────────────────────────────────────────────────────
// A single PrismaClient instance is shared across the entire process.
// Instantiating multiple clients would exhaust the Postgres connection pool.

declare global {
  // Allows reuse across hot-reload cycles in ts-node-dev without duplicates.
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: isDev ? ['error', 'warn'] : ['error'],
  });

if (isDev) {
  global.__prisma = prisma;
}
