<!-- prev: index.md | next: deployment.md -->

# Technology Stack

## Stack Overview

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| **Frontend** | React | 19.1 | Component model fits a multi-screen mobile SPA. |
| **Frontend language** | TypeScript | 5.8 | Strong typing for API models, forms, and shared UI contracts. |
| **Build tool** | Vite | 7.0 | Fast local development and simple production build. |
| **Routing** | React Router | 7.7 | Nested route tree supports onboarding, moderation, profile edit, feed, chat, and premium screens. |
| **Server state** | TanStack Query | 5.83 | Caching, loading states, and API query invalidation for SPA data. |
| **Client state** | Zustand | 5.0 | Lightweight local state for flows such as onboarding, moderation, and swipe cards. |
| **UI styling** | Tailwind CSS | 4.1 | Utility-first styling for mobile layouts and shared UI components. |
| **Backend language** | PHP | 8.2+ | Required by Laravel 12 and supported by common hosting/container stacks. |
| **Backend framework** | Laravel | 12.0 | Controllers, requests, validation, events, queues, ORM, Sanctum, Cashier, and Reverb ecosystem. |
| **Authentication** | Laravel Sanctum plus Telegram login | Sanctum 4.0 | Token/session API protection with Telegram identity as the entry mechanism. |
| **Database** | PostgreSQL/PostGIS | 15 | Relational data plus geospatial location support. |
| **Vector extension** | pgvector | Database extension | Prepares profile data for vector similarity and feed features. |
| **ORM** | Eloquent | Laravel 12 | First-class Laravel model and migration support. |
| **Cache/Queue** | Redis | 7-alpine | Queue backend and cache layer for background work. |
| **Realtime** | Laravel Reverb / Echo | Reverb 1.0 | Private WebSocket-style events for chat, matches, moderation, and user updates. |
| **Storage** | MinIO / S3-compatible storage | Latest locally | Local object storage with deployable S3/GCS-compatible abstraction. |
| **Payments** | Laravel Cashier / Stripe | Cashier 15.7 | Subscription lifecycle and payment integration. |
| **Deployment** | Docker, Nginx, Supervisor/Octane config | Project files | Reproducible services and production-style runtime layout. |

## Key Technology Decisions

### Decision 1: Laravel API

**Context:** The backend needed authenticated APIs, validation, database migrations, queues, events, file handling, payments, and real-time broadcasting.

**Decision:** Use Laravel 12 with service classes, DTOs, Eloquent models, form requests, custom rules, queues, events, Sanctum, Reverb, and Cashier.

**Rationale:**
- Laravel gives a complete backend toolkit without building infrastructure primitives manually.
- Form requests and rule classes make validation explicit and reusable.
- Eloquent migrations map well to a relational dating-domain model.
- Events and queues fit chat, moderation, notification, and file workflows.

**Trade-offs:**
- Pros: productive full-stack backend, mature ecosystem, strong conventions.
- Cons: requires PHP runtime knowledge and careful service boundaries to avoid oversized controllers.

### Decision 2: React/Vite Telegram Mini App

**Context:** The application needed a mobile-first, highly interactive UI with Telegram-specific initialization, swiping, modals, animations, media upload, and chat.

**Decision:** Use React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, i18next, Framer Motion, and Telegram Mini App SDK.

**Rationale:**
- React handles the large number of screens and shared UI components.
- TypeScript reduces integration mistakes with API resources.
- Vite keeps development fast.
- Feature-sliced folders make the frontend understandable as the number of flows grows.

### Decision 3: PostgreSQL with PostGIS and pgvector

**Context:** Dating discovery needs structured profile data, preferences, location-aware ordering, and future recommendation support.

**Decision:** Use PostgreSQL as the primary database and enable PostGIS and pgvector.

**Rationale:**
- Relational tables are appropriate for users, profiles, files, swipes, chats, subscriptions, and moderation records.
- PostGIS allows distance calculations from city coordinates.
- pgvector keeps vector-ready data close to the profile table instead of adding a separate vector service too early.

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Git** | Version control | Repository prepared as a step-by-step diploma history. |
| **npm** | Frontend dependencies and scripts | `npm install`, `npm run dev`, `npm run build`, `npm run lint`. |
| **Composer** | Backend dependencies and scripts | `composer install`, `composer test`, Laravel package discovery. |
| **ESLint/Prettier** | Frontend code quality | Configured in SPA package. |
| **PHPUnit** | Backend tests | Feature tests exist for feed and user profile controllers. |
| **Docker Compose** | Local service orchestration | Backend stack includes API, PostgreSQL, Redis, and MinIO. |
| **Laravel Artisan** | Backend development | Migrations, route list, queues, tests, cache/config commands. |
| **MkDocs** | Documentation structure | Template contains `mkdocs.yml` for documentation site/PDF workflows. |

## External Services & APIs

| Service | Purpose | Pricing Model |
|---------|---------|---------------|
| Telegram Bot API / Mini App | Login context, bot webhooks, notifications, and invoice flow. | External platform; project uses credentials. |
| Stripe | Subscription payments through Laravel Cashier. | Paid/payment provider model. |
| Sentry | Backend error tracking integration. | Free tier and paid tiers available. |
| MinIO/S3/GCS-compatible storage | User media storage. | Local MinIO for development; provider-dependent in production. |
| Google Tag Manager | Frontend analytics event tracking. | External analytics service. |
