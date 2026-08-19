# MailFlow 🚀

> **Production-Grade Email Scheduling & Campaign Dispatcher** with crash-safe queueing, rate limiting, and real-time delivery tracking.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│   • Email/Password & Google Auth   • Campaign Composer      │
│   • Scheduled Emails Tracker       • Sent Emails Analytics  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON API (:4000)
┌──────────────────────────────▼──────────────────────────────┐
│                  Backend (Express + TypeScript)             │
│   • Auth & Session Management      • Campaign Orchestrator  │
│   • Dual Token / Cookie Auth       • Hourly Rate Limiting   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     PostgreSQL 16 (DB)      ││       Redis 7 (AOF)          │
│   • Users, Senders          ││   • BullMQ Delayed Queue     │
│   • Campaigns, Scheduled    ││   • Distributed Rate Limit   │
│     Email Records           ││     Key: rate:{id}:{hour}    │
└─────────────────────────────┘└──────────────┬───────────────┘
                                              │ Worker Dispatch
                               ┌──────────────▼───────────────┐
                               │     Nodemailer Dispatcher    │
                               │   • Gmail SMTP (STARTTLS)    │
                               │   • Custom SMTP / Ethereal   │
                               └──────────────┬───────────────┘
                                              │ Public Internet
                               ┌──────────────▼───────────────┐
                               │    Recipient Email Inboxes   │
                               └──────────────────────────────┘
```

---

## ⚡ Core Features

- **Crash-Safe Queueing:** Uses Redis 7 with Append-Only File (`AOF`) persistence and a boot-time Postgres reconciler. If the server restarts, all pending jobs resume at their original scheduled times.
- **Hourly Rate Limiter:** Multi-worker safe atomic Redis counters (`rate:{senderId}:{YYYY-MM-DDTHH}`). If a limit is exceeded, jobs are delayed to the next hour boundary without being dropped.
- **Real SMTP Dispatch:** Connects directly via Gmail SMTP (`smtp.gmail.com:587` with STARTTLS) or custom SMTP with fallback to Ethereal sandbox.
- **Authentication:** Email & Password authentication with secure `scrypt` hashing + Google OAuth.
- **Modern UI:** Built with React 18, Vite, Tailwind CSS, Lucide icons, and responsive layouts.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL 16 & Redis 7)

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Aravindreddykothuru/MailFlow.git
cd MailFlow

# Install Frontend dependencies
npm install

# Install Backend dependencies
cd backend
npm install
cd ..
```

---

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your details:
```env
PORT=4000
FRONTEND_URL=http://localhost:5173

# Database & Redis (matches docker-compose.yml)
DATABASE_URL=postgresql://mailflow:mailflow@localhost:5433/mailflow
REDIS_URL=redis://localhost:6379

# SMTP Configuration (e.g. Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM_NAME="Aravind Reddy"
SMTP_FROM_EMAIL=your_email@gmail.com

JWT_SECRET=your-32-character-secret-key-goes-here
```

**Frontend (`.env.local`):**
```env
VITE_API_BASE_URL=http://localhost:4000
```

---

### 3. Start Database & Redis (Docker)

```bash
cd backend
docker compose up -d
npx prisma db push
cd ..
```

---

### 4. Run Application

In terminal 1 (Backend):
```bash
cd backend
npm run dev
```

In terminal 2 (Frontend):
```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser!

---

## 🧪 Testing

Run backend test suites (Rate limiter, Scheduler, Password Security):
```bash
cd backend
npm test
```

---

## 📁 Repository Structure

```
MailFlow/
├── src/                    # Frontend React + Vite application
│   ├── components/         # UI components & design system
│   ├── contexts/           # AuthContext & state providers
│   ├── features/           # Auth, Compose, Scheduled, Sent screens
│   ├── hooks/              # Form & scheduling hooks
│   └── services/           # API Client & email service
├── backend/                # Express + BullMQ Backend
│   ├── prisma/             # PostgreSQL schema & migrations
│   ├── src/
│   │   ├── config/         # Environment & Zod validation
│   │   ├── controllers/    # Auth, Campaign, Email endpoints
│   │   ├── middlewares/    # Auth & error handling
│   │   ├── queues/         # BullMQ queue definitions
│   │   ├── services/       # SMTP Sender, Rate Limiter, Scrypt
│   │   └── workers/        # BullMQ email worker & reconciler
│   ├── docker-compose.yml  # PostgreSQL 16 + Redis 7 AOF
│   └── package.json
├── package.json
└── README.md
```

---

## 📄 License
MIT
