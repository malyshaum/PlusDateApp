<!-- prev: none | next: 01-project-overview/index.md -->

# PlusDateApp

## Project Information

| Field | Value |
|-------|-------|
| **Student** | Mikita Malyshau |
| **Group** | 22-LR-JS |
| **Supervisor** | Andrii Kostromytskyi |
| **Date** | May 3, 2026 |

## Links

| Resource | URL |
|----------|-----|
| Production | `@stage_plusdate_bot` |
| Repository | PlusDateApp monorepository |
| API Docs | See [API Reference](appendices/api-reference.md) |
| Design | [Plus Date Figma](https://www.figma.com/design/vaugP8qk1zbtk3tqPswqK5/Plus-Date?node-id=5852-11409&t=50YjVAfNvscbvVVr-1) |

## Elevator Pitch

PlusDateApp is a Telegram Mini App dating platform for people who want a profile-based discovery experience without leaving Telegram. It solves the problem of fragmented onboarding, profile moderation, swiping, matching, chat, and premium access by combining these flows into one mobile-first web application. The project includes a Laravel API, a React/Vite single page application, PostgreSQL with PostGIS and pgvector support, real-time chat events, Telegram login and bot notifications, media moderation, and subscription flows.

## Evaluation Criteria Checklist

| # | Criterion | Status | Documentation |
|---|-----------|--------|---------------|
| 1 | Frontend Application | Completed | [frontend.md](02-technical/criteria/frontend.md) |
| 2 | Backend API | Completed | [backend-api.md](02-technical/criteria/backend-api.md) |
| 3 | Database Design | Completed | [database.md](02-technical/criteria/database.md) |
| 4 | Real-Time Communication | Completed | [realtime.md](02-technical/criteria/realtime.md) |
| 5 | Authentication and Telegram Integration | Completed | [telegram-auth.md](02-technical/criteria/telegram-auth.md) |
| 6 | Media Storage and Moderation | Completed | [media-moderation.md](02-technical/criteria/media-moderation.md) |
| 7 | Containerization and Deployment | Completed | [containerization-deployment.md](02-technical/criteria/containerization-deployment.md) |

## Documentation Navigation

- [Project Overview](01-project-overview/index.md) - business context, goals, users, scope, and requirements.
- [Technical Implementation](02-technical/index.md) - architecture, stack, selected criteria, and deployment.
- [User Guide](03-user-guide/index.md) - onboarding and main user scenarios.
- [Retrospective](04-retrospective/index.md) - results, technical debt, lessons learned, and next steps.
- [Appendices](appendices/index.md) - glossary, API reference, and database schema.

---

*Document created: May 3, 2026*
*Last updated: May 3, 2026*
