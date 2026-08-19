# ReachInbox Email Scheduler

Production-grade email job scheduler with a React dashboard (already built) backed by an Express + BullMQ + PostgreSQL + Redis service.

---

## Architecture

```
React Frontend (Vite)
  └── apiClient.ts  →  credentials: 'include'  →  httpOnly cookie session
         │
         ▼
Express API (port 4000)
  ├── GET  /auth/google          ← starts Google OAuth redirect
  ├── GET  /auth/google/callback ← exchanges code, sets JWT cookie
  ├── GET  /auth/me              ← session restore on page load
  ├── POST /campaigns/schedule   ← creates rows + enqueues BullMQ jobs
  ├── GET  /emails/scheduled     ← paginated PENDING list
  ├── GET  /emails/sent          ← paginated SENT/FAILED list
  └── DELETE /emails/scheduled/:id ← cancel + remove from queue
         │
         ├── PostgreSQL (source of truth)
         │     Users, Senders, Campaigns, ScheduledEmails
         │
         └── Redis (execution engine — AOF persistence)
               ├── BullMQ delayed job store
               └── rate:{senderId}:{YYYY-MM-DDTHH} counters
                        │
                        ▼
               BullMQ Worker
                 ├── concurrency: WORKER_CONCURRENCY
                 ├── limiter: MIN_DELAY_MS between dispatches
                 ├── rate-limit check → moveToDelayed(nextHour) on overflow
                 └── Nodemailer → Ethereal SMTP
```

---

## How the key guarantees work

### No duplicate sends (idempotency)

Every `ScheduledEmail` DB row has a UUID. That UUID is used as the BullMQ `jobId`. BullMQ refuses to add a job with a duplicate `jobId`, so calling `queue.add` twice for the same row is a no-op.

The worker also checks `row.status !== 'PENDING'` before sending — a second guard for the edge case where a job fires twice due to Redis AOF replay.

### Crash-safe (restart persistence)

Redis is configured with AOF persistence (`appendonly yes`) so all queued/delayed jobs survive a Redis restart.

On **every app boot**, the reconciler runs:

1. Queries Postgres for all `PENDING` rows.
2. Re-adds each to BullMQ with `jobId = row.id` and `delay = scheduledAt - now`.
3. If the job already exists in Redis, the add is a no-op.
4. If Redis was wiped but Postgres was intact, all jobs are re-enqueued with correct delays.

Test it: schedule a batch, then `docker compose restart` — jobs resume at their original times.

### Hourly rate limiting (multi-worker safe)

Rate counters use Redis `INCR`/`EXPIRE`, not in-process memory. Multiple worker instances share the same counter.

Key: `rate:{senderId}:{YYYY-MM-DDTHH}` (UTC hour bucket).

If the limit is exceeded, the worker calls `job.moveToDelayed(nextHourBoundary)` — the job is pushed to the next hour window, **not dropped or failed**. Order within the rescheduled batch is preserved.

---

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 20+
- Google OAuth credentials (create at https://console.cloud.google.com/apis/credentials)
  - Authorised redirect URI: `http://localhost:4000/auth/google/callback`

### 1. Start infrastructure

```bash
cd backend
docker compose up -d
```

### 2. Configure the backend

```bash
cp .env.example .env
# Edit .env: fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET
# For JWT_SECRET: openssl rand -hex 32
```

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Start the backend

```bash
npm run dev
# Server logs:
# PostgreSQL connected
# Email worker started { concurrency: 3, minDelayMs: 15000 }
# Boot reconciliation complete { total: 0, requeued: 0 }
# Server listening { port: 4000 }
```

### 5. Configure and start the frontend

```bash
cd ..
cp src/.env.example .env.local
# Set: VITE_API_BASE_URL=http://localhost:4000
npm run dev
# Open http://localhost:5173
```

---

## Prototype mode (no backend)

Leave `VITE_API_BASE_URL` empty in `.env.local`. All API calls resolve local fixtures.

```bash
npm run dev
```

---

## Environment Variables

### Backend (backend/.env)

| Variable                       | Required | Default                                    | Description                      |
| ------------------------------ | -------- | ------------------------------------------ | -------------------------------- |
| DATABASE_URL                   | yes      | —                                          | PostgreSQL connection string     |
| REDIS_URL                      | yes      | redis://localhost:6379                     | Redis with AOF persistence       |
| GOOGLE_CLIENT_ID               | yes      | —                                          | Google OAuth client ID           |
| GOOGLE_CLIENT_SECRET           | yes      | —                                          | Google OAuth client secret       |
| GOOGLE_CALLBACK_URL            | yes      | http://localhost:4000/auth/google/callback | Must match Google Console        |
| JWT_SECRET                     | yes      | —                                          | Min 32 chars                     |
| JWT_EXPIRES_IN                 |          | 7d                                         | JWT session lifetime             |
| WORKER_CONCURRENCY             |          | 3                                          | Parallel email slots             |
| MIN_DELAY_MS                   |          | 15000                                      | Min ms between consecutive sends |
| MAX_EMAILS_PER_HOUR_PER_SENDER |          | 50                                         | Hourly rate cap                  |
| FRONTEND_URL                   |          | http://localhost:5173                      | CORS origin                      |
| PORT                           |          | 4000                                       | HTTP server port                 |

### Frontend (src/.env.local)

| Variable          | Description                          |
| ----------------- | ------------------------------------ |
| VITE_API_BASE_URL | Backend URL. Empty = prototype mode. |

---

## Running Tests

```bash
cd backend
npm test
```

Covers:

- Rate limiter: allowed, at-limit, exceeded, INCR decrement on overflow, key format
- Scheduling: delay computation, hourly overflow, past startAt, missing sender

---

## Project Structure

```
Mailflow/
├── backend/
│   ├── src/
│   │   ├── config/       index.ts, logger.ts
│   │   ├── db/           client.ts, redis.ts
│   │   ├── routes/       auth, campaign, email
│   │   ├── controllers/  auth, campaign, email
│   │   ├── services/     scheduling, rateLimiter, sender
│   │   ├── queues/       email.queue.ts
│   │   ├── workers/      email.worker.ts, reconciler.ts
│   │   ├── middlewares/  auth, error
│   │   └── index.ts
│   ├── prisma/schema.prisma
│   ├── tests/
│   ├── docker-compose.yml
│   └── .env.example
└── src/                  Vite + React frontend (existing)
```

### CodeRabbit Review Test

Testing automated PR code review...
