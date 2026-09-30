# ReachInbox - Email Job Scheduler

An advanced, scalable email scheduling service and dashboard designed to handle bulk sending with strict concurrency controls, rate limiting, and observability.

## 🚀 Architecture & Tech Stack

This project is structured as a **Monorepo** containing both the backend service and the frontend dashboard.

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Queuing & Background Jobs**: BullMQ backed by Redis
- **Search Engine**: Elasticsearch (for full-text email search)
- **Authentication**: Google OAuth 2.0 (Passport.js) & JWT
- **Frontend**: React, Vite, Tailwind CSS, Headless UI
- **Infrastructure**: Docker Compose (`make run`)

### Key Features
1. **Bulk Staggering**: Schedule thousands of emails. The backend staggers them with `delayBetween` to prevent bursting upstream providers.
2. **Idempotency**: Every email queued has a unique job ID matching the database record to prevent double-sends in case of worker crashes.
3. **Throttling & Concurrency**: BullMQ workers are limited to process concurrently while enforcing a minimum inter-email delay (`MIN_DELAY_BETWEEN_SENDS_MS`).
4. **Redis-Backed Rate Limiter**: Enforces an absolute `MAX_EMAILS_PER_HOUR_PER_SENDER`. Exceeding this marks the email as `RATE_LIMITED` and dynamically reschedules it to the next hour.
5. **Slack Alerting**: Pushes an alert to a Slack channel when a rate limit is breached.
6. **Restart Recovery**: A startup script scans the PostgreSQL DB for jobs that are `SCHEDULED` but not actively in the BullMQ queue (due to Redis wipe or crash) and re-enqueues them automatically.
7. **Elasticsearch**: All email records are synchronized to Elasticsearch for fast, multi-field search from the dashboard.
8. **BullMQ Dashboard**: A real-time Arena/Bull-board is exposed at `/admin/queues` for deep observability.

## ⚙️ Local Setup Instructions

### 1. Prerequisites
- Docker and Docker Compose
- Node.js (v18+)
- Make

### 2. Environment Variables
You need to set up the environment variables. The easiest way is to copy the example file:
```bash
cp backend/.env.example backend/.env
```
Next, you **must** obtain credentials. Please read `CREDENTIALS_SETUP.md` at the root of the project to get your:
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- `SLACK_WEBHOOK_URL`
- `SMTP_USER` & `SMTP_PASS` (from Ethereal)

### 3. Start the Infrastructure & Backend
Run the root make command. This will spin up Postgres, Redis, and Elasticsearch, automatically run Prisma migrations, and keep the infrastructure running.
```bash
make run
```
*(In a separate terminal, to start the backend in dev mode)*
```bash
make backend
```
Backend will be available at `http://localhost:3001`
BullMQ Dashboard available at `http://localhost:3001/admin/queues`

### 4. Start the Frontend
In a new terminal:
```bash
make frontend
```
Frontend will be available at `http://localhost:5173`

## 🧹 Teardown
To shut down the infrastructure and wipe the Docker volumes (resetting the DB and Redis):
```bash
make clean
```

## 🧪 Testing the Rate Limiter
A script is provided to test bulk staggering and the hourly rate limiter automatically. 
While the backend is running, execute:
```bash
npx tsx backend/scripts/testRateLimiting.ts
```
This script attempts to schedule 15 emails with an hourly limit of 10. You will see 10 emails send successfully, and 5 emails get rescheduled to the next hour, triggering a Slack alert.
