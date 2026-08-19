# MailFlow — ReachInbox Email Scheduler 🚀

> **Production-Grade Email Job Scheduler & Campaign Dispatcher** built with TypeScript, Express, BullMQ + Redis, PostgreSQL (Prisma), Nodemailer (Ethereal SMTP / Real SMTP), and a modern React dashboard.

[![Tests](https://img.shields.io/badge/tests-17%20passed-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)]()
[![BullMQ](https://img.shields.io/badge/BullMQ-Redis%20Queue-red.svg)]()
[![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-teal.svg)]()

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite)                            │
│   • Google OAuth & Email/Pass Auth    • CSV Lead List Parser (Client)   │
│   • Campaign Composer & Sender Picker • Scheduled & Sent Email Trackers │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP + Session Cookie (credentials: 'include')
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Express.js Backend API (:4000)                       │
│   • Google OAuth & Cookie Sessions   • POST /campaigns/schedule         │
│   • GET /emails/scheduled & /sent    • GET & POST /senders              │
└──────────────────┬─────────────────────────────────┬────────────────────┘
                   │ Prisma ORM                      │ ioredis
┌──────────────────▼───────────────┐ ┌───────────────▼────────────────────┐
│         PostgreSQL 16            │ │            Redis 7 (AOF)           │
│  • Users, Senders                │ │  • BullMQ Delayed Job Queue        │
│  • Campaigns, ScheduledEmails    │ │  • Atomic Rate Limiter Keys        │
│    (Status: PENDING/SENT/FAILED) │ │    `rate:{senderId}:{YYYY-MM-DDTHH}`│
└──────────────────────────────────┘ └───────────────┬────────────────────┘
                                                     │
                                     ┌───────────────▼────────────────────┐
                                     │     Standalone BullMQ Worker       │
                                     │  • Concurrency: WORKER_CONCURRENCY │
                                     │  • Delay Limiter: MIN_DELAY_MS     │
                                     │  • Idempotency & Status Check      │
                                     │  • moveToDelayed(nextHour) on Cap  │
                                     └───────────────┬────────────────────┘
                                                     │ SMTP (STARTTLS)
                                     ┌───────────────▼────────────────────┐
                                     │   Ethereal SMTP / Real Outbound    │
                                     │   • Auto-generated test accounts   │
                                     │   • Preview URL extraction         │
                                     └────────────────────────────────────┘
```

---

## 🛡️ Key Architectural Guarantees

### 1. No Cron Dependency (Pure BullMQ Delay Scheduling)
Scheduling is implemented entirely via BullMQ's native delayed job scheduler (`delay: scheduledAt - now`). No `node-cron`, `agenda`, or OS crontab is used anywhere in the codebase.

### 2. Idempotency & Double-Processing Safety Net
Double sends are prevented via a two-layer defense:
1. **Queue Level (BullMQ `jobId`)**: Every `ScheduledEmail` database row UUID is used directly as the BullMQ `jobId`. BullMQ enforces unique job IDs within the queue; adding a job with an existing `jobId` is an automatic no-op.
2. **Worker Level (Database Status Guard)**: Before dispatching, the worker re-checks `ScheduledEmail.status === 'PENDING'`. If already `SENT` or `FAILED` (e.g. from an edge-case Redis replay or duplicate invocation), the job is skipped immediately.

### 3. Restart-Safety & Boot Reconciliation
Redis is configured with Append-Only File (`AOF`) persistence (`appendonly yes`). Even if the Redis volume is flushed or the host crashes:
- On every server/worker startup, `reconcilePendingJobs()` queries Postgres for all `PENDING` rows (`scheduledAt > now()` or missed past jobs).
- Each row is re-added to BullMQ with `jobId = row.id`.
- If the job is already active in Redis, BullMQ no-ops. If missing, it is seamlessly re-enqueued with the remaining delay (or `delay = 0` for immediate dispatch if its scheduled time elapsed while offline).

### 4. Distributed Multi-Worker Rate Limiting
Rate limiting operates across all worker instances using atomic Redis counters:
- **Key Pattern**: `rate:{senderId}:{YYYY-MM-DDTHH}` (UTC hour window)
- **TTL**: 1 hour (`expire(key, 3600)` on first write)
- **Exceeded Action**: When a sender exceeds `MAX_EMAILS_PER_HOUR_PER_SENDER`, the worker calculates the exact Unix timestamp of the start of the next hour and calls `job.moveToDelayed(nextHourTimestamp, job.token)`. Jobs are **never dropped or marked failed**.

### 5. Multi-Sender Support
Users can manage multiple sender profiles via the `Sender` table (`GET /senders`, `POST /senders`). Each sender has isolated Ethereal SMTP test credentials and can be selected during campaign composition.

---

## 📈 Behavior Under Heavy Load (1,000+ Emails)

When a bulk campaign with 1,000+ recipients is scheduled:
1. **Database Fan-Out**: 1,000 `ScheduledEmail` rows are created with pre-calculated delay offsets and hourly window rollovers.
2. **Queue Ingestion**: 1,000 BullMQ delayed jobs are created in parallel using row UUIDs as `jobId`.
3. **Throttled Dispatch**:
   - `WORKER_CONCURRENCY` controls how many emails process in parallel.
   - BullMQ `limiter: { max: 1, duration: MIN_DELAY_MS }` guarantees a mandatory delay between individual email dispatches.
4. **Hourly Cap Rollover**:
   - If the sender's hourly limit is reached (e.g., 50/hr), any remaining active jobs are rescheduled to the next UTC hour window with `moveToDelayed()`.
   - Redis counters automatically expire after 1 hour, resetting the window.

To simulate 1,000+ emails locally:
```bash
cd backend
npm run seed:load
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- (Optional) Google Cloud OAuth Credentials

### 1. Start Database & Redis via Docker
```bash
cd backend
docker compose up -d
```
This boots:
- PostgreSQL 16 on port `5433` (or `5432`)
- Redis 7 with AOF persistence on port `6379`

### 2. Configure Backend `.env`
```bash
cd backend
cp .env.example .env
```
Key settings in `backend/.env`:
```env
PORT=4000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://mailflow:mailflow@localhost:5433/mailflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secure-mailflow-jwt-secret-min-32-chars
WORKER_CONCURRENCY=3
MIN_DELAY_MS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=50
```

### 3. Run Prisma Database Migrations
```bash
npm run db:push
# or npm run db:migrate
```

### 4. Start the Application

**Option A: Run with integrated worker (single process dev)**
```bash
# Terminal 1: Backend API + Worker
cd backend
npm run dev

# Terminal 2: Frontend
cd ..
npm run dev
```

**Option B: Run as separate API and standalone worker processes**
```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Standalone Worker Process
cd backend
npm run worker:dev

# Terminal 3: Frontend (Vite)
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing

The backend includes a comprehensive Vitest test suite covering rate limiting, scheduler fanout, restart safety reconciliation, password hashing, and 1,000+ email load scaling.

```bash
cd backend
npm test
```

Test coverage includes:
- `rateLimiter.test.ts`: Atomic Redis INCR/EXPIRE, limit threshold, decrement on overflow, UTC key format.
- `scheduling.test.ts`: Per-recipient delays, hourly overflow rollover, future time validation.
- `reconciler.test.ts`: DB pending row re-enqueueing, past-delay recovery, `jobId` idempotency.
- `loadBatch.test.ts`: 1,000+ recipient batch scheduling across multiple hour windows.
- `password.test.ts`: Node crypto `scrypt` hashing and timing-safe verification.

---

## 🌐 API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/auth/register` | Email/password registration | No |
| `POST` | `/auth/login` | Email/password login | No |
| `GET` | `/auth/google` | Google OAuth redirect entry point | No |
| `GET` | `/auth/google/callback` | Google OAuth code exchange & cookie session | No |
| `POST` | `/auth/logout` | Clears session cookie | Yes |
| `GET` | `/me` / `/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/senders` | List all senders for authenticated user | Yes |
| `POST` | `/senders` | Create new sender with Ethereal SMTP account | Yes |
| `DELETE` | `/senders/:id` | Remove a sender profile | Yes |
| `POST` | `/campaigns/schedule` | Schedule campaign & fan out BullMQ jobs | Yes |
| `GET` | `/emails/scheduled` | Paginated upcoming emails (`?page=&limit=&status=`) | Yes |
| `GET` | `/emails/sent` | Paginated sent/failed emails (`?page=&limit=&status=`) | Yes |
| `DELETE` | `/emails/scheduled/:id`| Cancel scheduled email & remove from queue | Yes |
| `GET` | `/health` | Service health status check | No |

---

## ☁️ Live Deployment Guide

### 1. Backend + Worker + Redis + Postgres (Render / Railway)

1. **Postgres & Redis**: Provision managed PostgreSQL and Redis on Railway or Render.
2. **Web Service (API)**:
   - Build Command: `cd backend && npm install && npx prisma generate && npm run build`
   - Start Command: `cd backend && npx prisma migrate deploy && npm run start`
3. **Background Worker (Separate Service)**:
   - Same repository.
   - Start Command: `cd backend && npm run start:worker`
4. **Environment Variables**:
   - `DATABASE_URL`: Managed Postgres connection string
   - `REDIS_URL`: Managed Redis connection string
   - `FRONTEND_URL`: URL of deployed frontend (e.g. `https://mailflow-app.vercel.app`)
   - `JWT_SECRET`: Random 32+ character string
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `GOOGLE_CALLBACK_URL`: `https://<your-backend-api-url>/auth/google/callback`

### 2. Frontend (Vercel)

1. Connect GitHub repository to Vercel.
2. Framework Preset: **Vite**.
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://<your-backend-api-url>`
4. Deploy!

---

## 👥 GitHub Repository & Collaborators

To grant collaborator access to the project reviewers:
1. Navigate to your repository on GitHub: `Settings` → `Collaborators`.
2. Click **Add people** and invite:
   - **`Mitrajit`**
   - **`Yadav036`**
3. Or via GitHub CLI:
   ```bash
   gh api repos/:owner/:repo/collaborators/Mitrajit -X PUT
   gh api repos/:owner/:repo/collaborators/Yadav036 -X PUT
   ```

---

## ⚖️ Assumptions & Trade-offs

1. **Email Preview**: By default, Ethereal SMTP accounts are auto-provisioned per sender for instant testability without requiring personal email credentials. If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are provided, the system seamlessly transitions to real external SMTP delivery.
2. **Job Idempotency Key**: Using the Postgres `ScheduledEmail.id` (UUID) as the BullMQ `jobId` guarantees deduplication at both the DB and Redis layers.
3. **Hourly Quota Handling**: Rather than dropping or rejecting jobs when a rate limit is exceeded, jobs are gracefully delayed to the next hour boundary with `moveToDelayed()`.
