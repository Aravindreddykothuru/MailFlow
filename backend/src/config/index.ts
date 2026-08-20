import 'dotenv/config';
import { z } from 'zod';

// ─── Schema ──────────────────────────────────────────────────────────────────
// Every environment variable is declared here. Zod validates on startup so
// the server fails fast with a clear message instead of silently using undefined.

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),

  // Google OAuth (optional if using Email/Password auth)
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:4000/auth/google/callback'),

  // Resend HTTP API (port 443 — immune to cloud SMTP port blocks)
  RESEND_API_KEY: z.string().optional().default(''),

  // Real SMTP Provider (optional — if set, sends REAL emails to inboxes; if omitted, uses Ethereal test SMTP)
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_SECURE: z
    .preprocess((val) => val === 'true' || val === true || val === '1', z.boolean())
    .default(false),
  SMTP_USER: z.string().optional().default(''),

  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM_NAME: z.string().optional().default('MailFlow Dispatcher'),
  SMTP_FROM_EMAIL: z.string().optional().default(''),

  // JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('development-secret-jwt-key-min-32-chars-for-mailflow'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Worker tunables
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(3),
  MIN_DELAY_MS: z.coerce.number().int().positive().default(15_000),
  MAX_EMAILS_PER_HOUR_PER_SENDER: z.coerce.number().int().positive().default(50),
});


// ─── Validation ──────────────────────────────────────────────────────────────
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment configuration:');
  parsed.error.errors.forEach((err) => {
    console.error(`    ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

export const config = parsed.data;

export const isDev = process.env.NODE_ENV !== 'production';
