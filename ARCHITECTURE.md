# System Architecture: ReachInbox Email Scheduler

This document outlines the architectural decisions, component interactions, and data flow of the ReachInbox Email Scheduling system, built for the Outbox Labs hiring assignment.

---

## 1. High-Level Architecture

The system is built as a monolithic Node.js backend utilizing decoupled asynchronous workers for heavy lifting. It relies on a robust combination of PostgreSQL for persistent truth, Redis for fast queuing and rate limiting, and Elasticsearch for optimized full-text querying.

```mermaid
graph TD
    %% Define styles
    classDef frontend fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef worker fill:#8b5cf6,stroke:#4c1d95,stroke-width:2px,color:#fff
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef external fill:#6b7280,stroke:#374151,stroke-width:2px,color:#fff

    %% Nodes
    Client["React Frontend Dashboard"]:::frontend
    API["Express.js REST API"]:::api
    Auth[("Google OAuth 2.0")]:::external
    
    subgraph DataLayer [Data Layer]
        PG[("PostgreSQL Primary DB")]:::db
        Redis[("Redis Queue & Rates")]:::db
        ES[("Elasticsearch Search Index")]:::db
    end

    subgraph BackgroundProcessing [Background Processing]
        Worker["BullMQ Email Worker"]:::worker
        Recovery["Restart Recovery Service"]:::worker
    end
    
    subgraph ExternalIntegrations [External Integrations]
        SMTP["Ethereal Fake SMTP"]:::external
        Slack["Slack Webhook"]:::external
    end

    %% Connections
    Client -->|HTTP/JWT| API
    API -->|HTTP/JWT| Client
    API -->|OAuth Flow| Auth
    Auth -->|OAuth Flow| API
    
    API -->|Write/Read Models| PG
    API -->|Enqueue Jobs| Redis
    API -->|Search Queries| ES
    API -->|Sync on Create| ES
    
    Redis -->|Poll Jobs| Worker
    Worker -->|Read/Update State| PG
    Worker -->|Update Status| ES
    Worker -->|Check & Increment| Redis
    
    Worker -->|Send Mail| SMTP
    Worker -->|Alert on Limit| Slack
    
    Recovery -.->|Read Pending| PG
    Recovery -.->|Re-enqueue| Redis
```

---

## 2. Core Workflows & Data Flow

### A. Bulk Email Scheduling Flow

When a user submits a payload with thousands of recipient emails, the system guarantees efficient ingestion without hitting immediate limits.

```mermaid
sequenceDiagram
    participant User as Frontend
    participant API as Express API
    participant PG as PostgreSQL
    participant Redis as Redis Queue
    participant Worker as BullMQ Worker
    participant SMTP as Ethereal

    User->>API: POST /api/emails/schedule (N recipients)
    
    loop For each recipient (staggered)
        API->>PG: Create Email Record (Status: SCHEDULED)
        Note right of API: Delay = index * delayBetween
        API->>Redis: Enqueue Delayed Job (Idempotency Key = Email.ID)
        API->>PG: Update Record with bullJobId
    end
    
    API-->>User: 201 Scheduled Successfully
    
    Note over Redis,Worker: ... time passes (delay expires) ...
    
    Redis->>Worker: Dispatch Job
    Worker->>PG: Find Email by ID
    
    alt Email is already SENT
        Worker-->>Redis: Skip (Idempotency check passed)
    else Proceed to Send
        Worker->>Worker: Check Redis Rate Limiter
        Worker->>SMTP: Send Email via Nodemailer
        Worker->>PG: Update Status to SENT
    end
```

### B. Rate Limiting & Rescheduling Flow

The system protects upstream SMTP servers using a Redis-backed sliding/fixed window rate limiter.

```mermaid
flowchart TD
    Start(["Worker picks up job"]) --> GetEmail["Fetch email from DB"]
    GetEmail --> IdempCheck{"Already Sent?"}
    
    IdempCheck -->|Yes| End1(["Skip & Resolve"])
    IdempCheck -->|No| RateCheck["Check Redis Hourly Limit INCR"]
    
    RateCheck --> Allowed{"Limit Exceeded?"}
    
    Allowed -->|No| Send["Send via SMTP"]
    Send --> UpdateSuccess["Update DB & ES to SENT"] --> End2(["Job Complete"])
    
    Allowed -->|Yes| Reject["Revert Redis Increment"]
    Reject --> Calc["Calculate Delay to Next Hour"]
    Calc --> UpdateDB["Update DB to RATE_LIMITED"]
    UpdateDB --> Requeue["Re-enqueue to BullMQ with delay"]
    Requeue --> Slack["Fire Slack Alert Webhook"] --> End3(["Job Rescheduled"])
```

---

## 3. Key Design Decisions

### 1. Separation of Concerns (Queues vs. Database)
- **PostgreSQL** acts as the definitive source of truth for the state of an email (`SCHEDULED`, `RATE_LIMITED`, `SENT`, `FAILED`).
- **Redis (BullMQ)** is treated strictly as an ephemeral state machine. If Redis crashes and data is lost, the system can reconstruct the queue entirely from PostgreSQL.

### 2. Idempotency Guarantee
When `POST /api/emails/schedule` is hit, it generates an email record in Postgres. The resulting Database `id` is passed to BullMQ as the `jobId` parameter. BullMQ natively ignores jobs pushed with an identical `jobId`. Additionally, the worker explicitly checks the database before sending to guarantee the email hasn't already been dispatched.

### 3. Graceful Staggering & Throttling
- **Controller-Level Staggering:** Bulk schedules are natively staggered at the time of insertion by multiplying the user's `delayBetween` configuration by the array index.
- **Worker-Level Throttling:** BullMQ is configured with a `limiter` option on the worker, hard-capping the speed at which a single node can pull jobs, completely independent of the scheduled timestamps.

### 4. Elasticsearch for Real-Time UI
Instead of complex `ILIKE` queries in PostgreSQL that degrade under load, all email records are double-written to Elasticsearch. The Dashboard search bar directly interfaces with an ES `multi_match` query, ensuring sub-millisecond lookups across `subject`, `body`, and `to` fields regardless of scale.

### 5. Restart Recovery Protocol
A standalone script (`src/services/restartRecovery.ts`) fires on server boot. It queries PostgreSQL for any email that should be in the queue (`status: SCHEDULED` or `RATE_LIMITED`) and verifies its existence in Redis. If the job was lost due to a crash, it is instantly reconstructed and re-enqueued.

---

## 4. Database Schema

The minimal required schema to support the above operations:

```prisma
model User {
  id        String   @id @default(uuid())
  googleId  String   @unique
  email     String   @unique
  name      String?
  avatar    String?
  emails    Email[]
  createdAt DateTime @default(now())
}

model Email {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  to           String
  subject      String
  body         String
  senderEmail  String
  status       String    @default("SCHEDULED") // SCHEDULED, QUEUED, RATE_LIMITED, SENDING, SENT, FAILED
  scheduledAt  DateTime
  sentAt       DateTime?
  errorMessage String?
  bullJobId    String?   // Links DB to Redis
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```
