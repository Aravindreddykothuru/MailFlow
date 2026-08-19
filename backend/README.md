# MailFlow Backend — Express API & BullMQ Dispatcher

Production-grade email job scheduler service built with **Express.js, TypeScript, BullMQ + Redis, PostgreSQL (Prisma), Nodemailer (Ethereal SMTP / Real SMTP), Google OAuth 2.0, Zod, and Pino logging**.

---

## 🏗️ Architecture & Component Flow

```
HTTP Clients (React Frontend / API)
       │
       ▼
Express API (:4000)
  ├── POST /auth/register & /auth/login   (Email + Scrypt)
  ├── GET  /auth/google & /callback       (Google OAuth 2.0)
  ├── GET  /me                            (Session profile)
  ├── GET  /senders & POST /senders       (Multi-sender profiles)
  ├── POST /campaigns/schedule            (Fanout & BullMQ delay jobs)
  ├── GET  /emails/scheduled & /emails/sent (Paginated lists + filtering)
  └── DELETE /emails/scheduled/:id        (Cancellation)
       │
       ├── PostgreSQL (Database source of truth)
       │     Tables: User, Sender, Campaign, ScheduledEmail
       │
       └── Redis (BullMQ Queue + Distributed Rate Limiting)
             ├── Queue: 'email-dispatch' (Delayed jobs)
             └── Key: rate:{senderId}:{YYYY-MM-DDTHH}
                   │
                   ▼
       BullMQ Worker Process (Standalone or Integrated)
         ├── Concurrency: WORKER_CONCURRENCY
         ├── Queue Limiter: MIN_DELAY_MS between dispatches
         ├── DB State Verification (status === 'PENDING')
         ├── Redis Hourly Rate Check (moveToDelayed on overflow)
         └── Nodemailer Dispatch (Ethereal / Real SMTP)
```

---

## ⚡ Guarantees & Implementation Details

### 1. Pure Delay-Based Scheduling (No Cron)
Scheduling is implemented entirely via BullMQ's native delayed queue (`delay = scheduledAt - Date.now()`). No cron libraries or crontabs are used.

### 2. Idempotency & Duplicate Prevention
- **Queue Level**: The database UUID (`ScheduledEmail.id`) is passed directly as the BullMQ `jobId`. BullMQ treats duplicate job IDs as no-ops.
- **Worker Level**: The worker queries `ScheduledEmail.status` before dispatching. If it's not `PENDING`, the worker skips it safely.

### 3. Restart-Safety & Boot Reconciliation
- Redis runs with Append-Only File (`AOF`) persistence.
- On startup, `reconcilePendingJobs()` queries all `PENDING` emails from Postgres and re-adds them to the BullMQ queue. BullMQ skips any jobs that already exist in Redis.

### 4. Distributed Rate Limiting
- Key pattern: `rate:{senderId}:{YYYY-MM-DDTHH}`.
- Uses atomic `INCR` + `EXPIRE` (1 hour).
- If `count > MAX_EMAILS_PER_HOUR_PER_SENDER`, calls `job.moveToDelayed(nextHourTimestamp, job.token)` so jobs roll over into the next hour window rather than failing.

---

## 🚀 Local Development

### 1. Infrastructure
```bash
docker compose up -d
```

### 2. Install & Migrate
```bash
npm install
npm run db:push
```

### 3. Run Dev Server
```bash
npm run dev
```

To run the worker in a separate standalone process:
```bash
npm run worker:dev
```

### 4. Run Load Seeding Script (1,000+ Emails)
```bash
npm run seed:load
```

---

## 🧪 Testing

```bash
npm test
```

Runs the Vitest test suite covering:
- `rateLimiter.test.ts`
- `scheduling.test.ts`
- `reconciler.test.ts`
- `loadBatch.test.ts`
- `password.test.ts`
