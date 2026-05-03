<!-- prev: ../01-project-overview/features.md | next: tech-stack.md -->

# 2. Technical Implementation

This section describes the architecture, technology choices, implementation decisions, selected assessment criteria, and deployment approach for PlusDateApp.

## Contents

- [Tech Stack](tech-stack.md)
- [Criteria Documentation](criteria/_template.md)
- [Deployment](deployment.md)

## Solution Architecture

### High-Level Architecture

```mermaid
flowchart TB
    User["Telegram User"]
    Telegram["Telegram Mini App and Bot API"]
    SPA["React/Vite SPA\nTelegram WebView UI"]
    API["Laravel 12 API\nControllers, Services, DTOs, Rules"]
    Reverb["Laravel Reverb\nPrivate Channels"]
    Queue["Laravel Queue\nModeration, Notifications, Files"]
    Redis["Redis\nQueue and Cache"]
    DB["PostgreSQL 15\nPostGIS and pgvector"]
    Storage["MinIO / S3-compatible Storage"]
    Stripe["Stripe Cashier"]
    Sentry["Sentry"]

    User --> Telegram
    Telegram --> SPA
    SPA --> API
    SPA <--> Reverb
    API --> DB
    API --> Redis
    API --> Storage
    API --> Stripe
    API --> Queue
    Queue --> Redis
    Queue --> Storage
    Queue --> Telegram
    API --> Reverb
    API --> Sentry
```

The frontend is a single page application designed for Telegram's mobile webview. It communicates with the Laravel API over HTTP and subscribes to private real-time channels through Laravel Echo/Reverb. The backend owns domain logic for profiles, feed, swipes, chats, moderation, files, subscriptions, dictionaries, and administration. PostgreSQL stores structured data, PostGIS supports distance-based city filtering, pgvector prepares the profile table for vector features, Redis supports queues/cache, and MinIO or S3-compatible storage stores uploaded media.

### System Components

The system is split into the following runtime components:

- **Frontend SPA:** mobile-first Telegram Mini App UI for onboarding, profile, feed, likes, chat, premium, moderation, and settings. Technologies: React 19, TypeScript, Vite 7, React Router, TanStack Query, Zustand, i18next, Tailwind CSS 4.
- **Backend API:** REST API and business workflows for authentication, users, feed, chat, storage, moderation, payments, dictionaries, admin, and bot webhooks. Technologies: Laravel 12, PHP 8.2, Sanctum, DTOs, services, rules, Eloquent.
- **Database:** persistent relational data with geospatial and vector extensions. Technologies: PostgreSQL 15, PostGIS, pgvector.
- **Realtime:** private event channels for chat, matches, moderation, and user updates. Technologies: Laravel Reverb and Laravel Echo.
- **Queue and Cache:** background jobs for moderation, media processing, notifications, and system tasks. Technologies: Redis and Laravel Queue.
- **Storage:** user photo/video storage and derived blurred images. Technologies: MinIO locally and S3/GCS-compatible storage abstractions.
- **External Services:** identity, notifications, invoices, payments, and error tracking. Technologies: Telegram Bot API, Stripe Cashier, Sentry.

### Data Flow

```mermaid
sequenceDiagram
    participant U as Telegram User
    participant F as React SPA
    participant A as Laravel API
    participant D as PostgreSQL
    participant S as Storage
    participant Q as Queue/Redis
    participant R as Reverb

    U->>F: Open Mini App and perform action
    F->>A: Authenticated HTTP request
    A->>D: Validate and read/write domain data
    A->>S: Store or read media when needed
    A->>Q: Dispatch background job when needed
    A->>R: Broadcast domain event when needed
    A-->>F: JSON response
    R-->>F: Real-time event update
    F-->>U: Update current screen
```

## Key Technical Decisions

The main architecture decisions are:

- **Use Telegram Mini App instead of native apps.** Rationale: fast access, Telegram identity, bot notifications, and no app-store delivery requirement. Alternatives considered: native iOS/Android and a generic responsive website.
- **Use Laravel as backend.** Rationale: strong API features, queues, events, validation, Eloquent ORM, Sanctum, Cashier, and Reverb support. Alternatives considered: Node.js/NestJS, Django, and Spring Boot.
- **Use React/Vite SPA.** Rationale: fast iteration, TypeScript support, rich mobile UI, and feature-sliced frontend structure. Alternatives considered: Vue, Next.js, and server-rendered Blade.
- **Use PostgreSQL with PostGIS and pgvector.** Rationale: one database supports relational data, distance ordering, and vector-ready profile features. Alternatives considered: MySQL, MongoDB, and a separate vector database.
- **Use service and DTO layers.** Rationale: controllers stay thin and business flows remain explicit. Alternatives considered: fat controllers and direct model manipulation from frontend-specific controllers.
- **Use Docker assets.** Rationale: reproducible local setup for API, database, Redis, MinIO, and SPA. Alternative considered: manual local installation only.

## Security Overview

- **Authentication:** Telegram login endpoint and Laravel Sanctum protected routes.
- **Authorization:** route middleware, request validation, and domain rule classes such as file, profile, feed, and storage rules.
- **Data protection:** HTTPS is expected in production; secrets are environment variables; uploaded files are handled by storage services.
- **Input validation:** Laravel form requests, enum-based validation, zod schemas in frontend forms, and custom rule classes.
- **Secrets management:** `.env` files for local development; deployment should use platform secrets.
- **Moderation:** user moderation records, moderation jobs, and frontend route guards block unresolved high-risk states.
