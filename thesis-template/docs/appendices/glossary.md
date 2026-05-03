<!-- prev: index.md | next: api-reference.md -->

# Glossary

| Term | Definition |
|------|------------|
| PlusDateApp | Telegram Mini App dating platform implemented in this diploma project. |
| Mini App | A web application opened inside Telegram's webview. |
| Onboarding | Guided setup flow that collects required profile data before feed access. |
| Feed | Discovery screen that shows profile cards for swiping. |
| Swipe | User decision on a profile, such as like or dislike. |
| Match | Mutual positive decision between two users that enables conversation. |
| Moderation | Process of validating profile media or user state before normal access. |
| Premium | Paid access tier represented by subscription and premium UI flows. |
| Dictionary | Reference data such as countries, cities, activities, and hobbies. |
| Deletion snapshot | Stored data used by account deletion/restore workflow. |

## Acronyms

| Acronym | Full Form | Description |
|---------|-----------|-------------|
| API | Application Programming Interface | Backend endpoints used by the SPA. |
| SPA | Single Page Application | Frontend application rendered in the browser/webview. |
| DTO | Data Transfer Object | Structured object used to pass data between layers. |
| ORM | Object-Relational Mapper | Eloquent maps PHP models to database tables. |
| ADR | Architecture Decision Record | Documentation format used for evaluation criteria. |
| GTM | Google Tag Manager | Analytics integration used by the frontend. |
| CDN | Content Delivery Network | Potential future media delivery layer. |

## Domain-Specific Terms

### Dating Domain

| Term | Definition |
|------|------------|
| Search preferences | User settings that control which profiles appear in the feed. |
| Incoming like | A positive decision made by another user before the current user responds. |
| Revert swipe | Premium-style action that undoes a previous swipe decision when allowed. |
| Verification media | Photo or video used to increase trust and support moderation. |

### Technical Domain

| Term | Definition |
|------|------------|
| PostGIS | PostgreSQL extension used for geospatial data and distance calculations. |
| pgvector | PostgreSQL extension used for vector fields and similarity-oriented data. |
| Reverb | Laravel realtime server used for broadcasting events. |
| Sanctum | Laravel package used to protect authenticated API routes. |
| MinIO | Local S3-compatible object storage used for media in development. |
