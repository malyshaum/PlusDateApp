<!-- prev: stakeholders.md | next: features.md -->

# Project Scope

## In Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| Telegram authentication | Login endpoint and frontend initialization for Telegram Mini App context. | Must |
| Onboarding | Guided steps for basic data, age, city, interests, media, and verification. | Must |
| Profile management | View and edit profile fields, photos, video, search preferences, settings, referral, deletion, and restore flow. | Must |
| Feed and swipes | Profile discovery, like, dislike, superlike-oriented UI, revert swipe, match handling, and available swipe counters. | Must |
| Likes and matches | List incoming likes, respond to likes, and remove matches. | Must |
| Chat | Chat list, message list, send messages, unread counts, and read state updates. | Must |
| Media storage | Photo/video upload, main photo selection, delete file, MinIO/external storage abstraction, and blurred-photo job. | Should |
| Moderation | User moderation status, photo validation, moderation screens, and Telegram moderation webhook. | Should |
| Subscriptions | Premium page, current subscription, subscribe, cancel, Stripe Cashier, Telegram invoice path. | Should |
| Containerized setup | Docker assets for backend, frontend, database, Redis, and MinIO. | Should |

## Out of Scope

| Feature | Reason | When Possible |
|---------|--------|---------------|
| Native mobile apps | The chosen delivery channel is Telegram Mini App plus responsive SPA. | Future phase |
| Full moderation dashboard | Admin endpoints exist, but a complete web dashboard is beyond diploma scope. | Future phase |
| Multi-language documentation | Thesis must be in English; app localizations exist for English and Russian UI texts. | Not required for thesis |
| Advanced ML recommendation engine | Database is prepared for vectors, but a full training/recommendation system is too large for this scope. | Future phase |
| Group chats and social feed | The product focuses on one-to-one dating matches. | Future phase |

## Assumptions

| # | Assumption | Impact if Wrong | Probability |
|---|------------|-----------------|-------------|
| 1 | Users are comfortable opening the product through Telegram. | A standalone login and distribution channel would be required. | Medium |
| 2 | PostgreSQL with PostGIS and pgvector is acceptable for the data layer. | Location and vector-ready features would need redesign. | Low |
| 3 | External services such as Telegram, Stripe, and object storage are available in the target environment. | Login, invoices, notifications, or uploads may fail without mocks. | Medium |
| 4 | Mobile-first UX is more important than desktop-specific screens. | Desktop layout would require additional design work. | Low |

## Constraints

| Constraint Type | Description | Mitigation |
|-----------------|-------------|------------|
| **Time** | Diploma project has a fixed build and assessment period. | Scope focuses on a complete vertical slice instead of native apps and large admin panels. |
| **Budget** | Paid external services should be optional or configurable. | Environment variables and local Docker services are used where possible. |
| **Technology** | Telegram Mini App imposes webview and SDK constraints. | Frontend initialization handles viewport, theme, safe area, closing behavior, and back button behavior. |
| **Resources** | Project is implemented as a student project. | Code is organized into clear backend services and feature-sliced frontend modules. |
| **External** | Telegram, Stripe, storage, and Sentry depend on credentials and network access. | Integrations are isolated behind controllers, services, configuration, and environment variables. |

## Dependencies

| Dependency | Type | Owner | Status |
|------------|------|-------|--------|
| Telegram Bot API and Mini App environment | External | Telegram | Implemented |
| Stripe / Laravel Cashier | External | Stripe and Laravel ecosystem | Implemented |
| PostgreSQL/PostGIS/pgvector | Technical | PostgreSQL ecosystem | Implemented |
| Redis | Technical | Redis ecosystem | Implemented |
| MinIO or S3-compatible storage | Technical | Storage provider | Implemented |
| Laravel Reverb | Technical | Laravel ecosystem | Implemented |
| React/Vite/TanStack Query/Zustand | Technical | JavaScript ecosystem | Implemented |
