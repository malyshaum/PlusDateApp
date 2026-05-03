# PlusDateApp

PlusDateApp is a dating platform monorepo with a Laravel API, a React/Vite SPA, and a dedicated database layer.

## Repository Layout

- [api/](api/) - Laravel backend, API endpoints, domain services, queues, broadcasting, and integrations.
- [spa/](spa/) - React frontend built with Vite and a feature-sliced structure.
- [database/](database/) - PostgreSQL/PostGIS bootstrap files and database container setup.

## Architecture

The project is split into three main parts:

- Backend API in Laravel 12.
- Frontend SPA in React 19 + TypeScript.
- PostgreSQL/PostGIS database with extra extensions for geospatial and vector features.

The backend handles authentication, profiles, feeds, chats, moderation, subscriptions, file storage, and Telegram integrations. The frontend contains onboarding, profile editing, discovery feed, chat, premium flows, and shared UI.

## Git History

The repository is prepared as a 120-commit walkthrough. The commit author is configured locally as:

- name: `malyshaum`
- email: `mikita.malyshau@stud.esdc.lt`

The history is arranged from late February 2026 to the end of April 2026 so the project can be presented as a step-by-step build.

## Running the Project

### Backend

See [api/README.md](api/README.md) for backend setup and commands.

### Frontend

See [spa/README.md](spa/README.md) for SPA setup and commands.

### Database

See [database/README.md](database/README.md) for database bootstrap details.

## What the Project Includes

- Telegram login and bot webhooks.
- User profiles, media upload, and profile preferences.
- Discovery feed and swipe logic.
- Real-time chat and message states.
- Moderation and safety flows.
- Premium subscriptions and payment-related flows.
- Shared dictionary endpoints for cities, countries, activities, and hobbies.

## Notes

- The backend and SPA are both container-friendly.
- Environment files should be created from the `.env.example` templates inside each app.
- Database extensions include PostGIS and pgvector.
