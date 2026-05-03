<!-- prev: problem-and-goals.md | next: scope.md -->

# Stakeholders & Users

## Target Audience

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| Dating user | A Telegram user who wants to meet people through a mobile-first interface. | Fast start, clear onboarding, relevant feed, safe media, chat after matching. |
| Premium user | A highly active user who wants fewer limits and more control over discovery. | More swipes, advanced filters, revert actions, visibility of likes, premium explanations. |
| Moderator or administrator | A project operator responsible for user safety and test data. | Account management, profile creation for bot/test users, moderation status visibility. |
| Developer or maintainer | A person maintaining the codebase after the diploma defense. | Clear architecture, reproducible setup, isolated services, documented endpoints and database schema. |

## User Personas

### Persona 1: Anna, Regular User

| Attribute | Details |
|-----------|---------|
| **Role** | End user looking for matches |
| **Age** | 20-30 |
| **Tech Savviness** | Medium |
| **Goals** | Create a profile quickly, see people nearby, avoid unsafe profiles, and chat after a match. |
| **Frustrations** | Long registration, unclear profile requirements, irrelevant profiles, slow messaging. |
| **Scenario** | Anna opens the Mini App from Telegram, completes onboarding, uploads photos and a verification photo, waits for moderation, then uses the feed and chat. |

### Persona 2: Mark, Premium-Oriented User

| Attribute | Details |
|-----------|---------|
| **Role** | Active dating app user |
| **Age** | 25-38 |
| **Tech Savviness** | High |
| **Goals** | Tune search preferences, see likes, revert an accidental dislike, and use premium filters. |
| **Frustrations** | Hard limits, weak filters, and payment flows that interrupt mobile usage. |
| **Scenario** | Mark updates height, activity, city, eye color, and interest preferences, opens the premium page, and buys access through a supported subscription flow. |

### Persona 3: Project Maintainer

| Attribute | Details |
|-----------|---------|
| **Role** | Developer or technical reviewer |
| **Age** | Any |
| **Tech Savviness** | High |
| **Goals** | Understand the architecture, run the services locally, verify API behavior, and inspect data relationships. |
| **Frustrations** | Hidden dependencies, undocumented routes, missing environment variables, and unclear service boundaries. |
| **Scenario** | The maintainer starts PostgreSQL, Redis, MinIO, the Laravel API, and the Vite SPA, then tests login, feed, upload, and chat flows. |

## Stakeholder Map

### High Influence / High Interest

- Student developer: responsible for implementation, documentation, and defense.
- Supervisor and assessment committee: evaluate the business scope, technical quality, documentation, and honesty of results.

### High Influence / Low Interest

- External service providers: Telegram, Stripe, storage providers, Sentry, and hosting platforms affect availability and constraints but are not involved in daily product decisions.

### Low Influence / High Interest

- End users: they directly benefit from the product and provide feedback, but they do not decide architecture.
- Future maintainers: they rely on code quality and documentation after the defense.

### Low Influence / Low Interest

- Casual visitors: they may see the application through a shared link but are not part of the primary product flow until they authenticate and onboard.
