# PlusDate SPA

React + Vite frontend for PlusDateApp.

## Stack

- React 19
- TypeScript
- Vite 7
- React Router
- TanStack Query
- Zustand
- i18next
- Framer Motion
- Tailwind CSS 4
- Telegram Mini App SDK

## Architecture

The frontend uses a feature-sliced style structure:

- [src/app/](src/app/) - application bootstrap, routing, initialization, and providers.
- [src/pages/](src/pages/) - full screens.
- [src/widgets/](src/widgets/) - larger UI compositions.
- [src/features/](src/features/) - user interactions and business-facing UI pieces.
- [src/entities/](src/entities/) - domain entities and reusable entity-level components.
- [src/shared/](src/shared/) - API client, config, types, utilities, UI kit, and shared assets.

## Main Screens

- onboarding and Telegram initialization
- profile view and profile editing
- search preferences
- feed and swipe cards
- chat and chats list
- premium and payment screens
- moderation flows
- guest / referral / restore / delete profile pages

## Local Setup

### Requirements

- Node.js 22+

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Environment Variables

Frontend variables are usually defined in `.env` or `.env.local` and passed to Vite at build time.

Common values used by the app include:

- API base URL
- Socket auth URL
- Socket host and port
- Google Tag Manager token

## Telegram Mini App Notes

The app bootstraps Telegram-specific behavior in [src/app/init.ts](src/app/init.ts). That includes:

- viewport mounting
- safe area and theme handling
- write access requests
- closing behavior
- location and swipe behavior setup

## Deployment

This folder also contains Docker-related files for containerized deployment:

- [Dockerfile](Dockerfile)
- [docker-compose.yml](docker-compose.yml)
- [nginx.conf](nginx.conf)

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for a deployment walkthrough.

