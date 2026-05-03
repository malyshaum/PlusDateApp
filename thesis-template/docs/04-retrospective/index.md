<!-- prev: ../03-user-guide/faq.md | next: ../appendices/index.md -->

# 4. Retrospective

This section reflects on the project development process, technical results, known issues, and future improvements.

## What Went Well

### Technical Successes

- The project reached a complete full-stack shape instead of remaining a prototype: backend, frontend, database, storage, queues, sockets, and Docker assets are present.
- Laravel worked well for a domain-heavy API because requests, rules, services, events, jobs, resources, migrations, and queues could be organized by product flow.
- React with TypeScript and Vite supported a rich Telegram Mini App interface with many screens and shared UI components.
- PostgreSQL with PostGIS and pgvector gave the data layer room for location-based and vector-ready discovery features.
- The chat service uses transactions and advisory locks to avoid duplicate chats between the same users.
- The repository includes README files and documentation sources that make review easier.

### Process Successes

- Splitting the repository into `api`, `spa`, and `database` made responsibilities clear.
- The feature-sliced frontend structure prevented all UI code from being concentrated in a single pages folder.
- The backend service layer kept business logic more understandable than fat controllers.
- Docker assets reduced the amount of manual infrastructure setup needed for review.

### Personal Achievements

- Built and documented a multi-module product instead of a single isolated application.
- Practiced integrating external services such as Telegram, Stripe, Sentry, storage providers, and Reverb.
- Improved understanding of real product constraints: onboarding gates, moderation, media validation, profile visibility, and account lifecycle.

## What Did Not Go As Planned

| Planned | Actual Outcome | Cause | Impact |
|---------|---------------|-------|--------|
| Complete production deployment links | Production is available through Telegram bot `https://t.me/stage_plusdate_bot`, but a separate public web URL is not specified. | Product is distributed through Telegram Mini App. | Low |
| Generated API documentation | API reference is manually documented. | OpenAPI annotations/generator were not added during implementation. | Medium |
| Full automated UI tests | Backend has some feature tests, but frontend E2E tests are absent. | Time was spent on product flows and integrations. | Medium |
| Complete admin/moderation dashboard | Backend admin/moderation endpoints exist, but full dashboard is out of scope. | Diploma scope prioritized user-facing flows. | Low |

### Challenges Encountered

1. **Telegram-specific local testing**
   - Problem: Some frontend behavior depends on Telegram webview APIs.
   - Impact: Browser-only development cannot fully represent production behavior.
   - Resolution: Telegram initialization was isolated in app bootstrap and documented as a platform dependency.

2. **Media and moderation complexity**
   - Problem: Uploading files is not only a storage task; it affects trust, profile visibility, and user routing.
   - Impact: More backend rules, jobs, and frontend states were required.
   - Resolution: Media, moderation, and route-guard behavior were separated into services, jobs, and dedicated screens.

3. **Real-time configuration**
   - Problem: Chat requires HTTP API, private channel authorization, socket host variables, and frontend subscriptions to align.
   - Impact: Deployment has more environment variables and test cases.
   - Resolution: Reverb/Echo-related configuration was kept explicit and documented.

## Technical Debt & Known Issues

| ID | Issue | Severity | Description | Potential Fix |
|----|-------|----------|-------------|---------------|
| TD-001 | Limited production URL details | Low | Documentation includes Telegram bot `https://t.me/stage_plusdate_bot`, but not a separate API or web hosting URL. | Add API/web URLs if they are exposed separately. |
| TD-002 | Manual API docs | Medium | API reference can become outdated as routes change. | Add OpenAPI generation or route-to-doc tooling. |
| TD-003 | Limited automated coverage | Medium | Chat, moderation, storage, payments, and frontend flows need more tests. | Add PHPUnit feature tests and Playwright E2E tests. |
| TD-004 | No full moderator dashboard | Low | Moderation exists, but operations UI is limited. | Build admin moderation queue and review screens. |
| TD-005 | Performance indexes not fully documented | Low | Feed and chat queries may need optimization at scale. | Add query plans, indexes, and load testing notes. |

### Code Quality Issues

- API documentation should be generated from code or route metadata.
- Frontend should add E2E tests for onboarding, feed, likes, and chat.
- Storage and payment flows need documented mock/stub modes for reviewers without real credentials.

## Future Improvements

### High Priority

1. **OpenAPI documentation**
   - Description: Generate API docs from route/controller annotations or a maintained OpenAPI file.
   - Value: Reduces mismatch between implementation and documentation.
   - Effort: Medium.

2. **End-to-end test suite**
   - Description: Add Playwright tests for onboarding, feed, chat, premium, and moderation.
   - Value: Protects the most important user workflows.
   - Effort: Medium to high.

### Medium Priority

3. **Moderator dashboard**
   - Description: Build a web UI for reviewing media and moderation records.
   - Value: Makes safety operations more realistic.

4. **Recommendation improvements**
   - Description: Use the existing vector-ready database support for profile similarity and better ranking.
   - Value: Improves feed relevance.

### Nice to Have

5. Add a formal production CI/CD workflow.
6. Add CDN configuration for media delivery.
7. Add analytics dashboards for onboarding drop-off, swipes, matches, and subscription conversion.

## Lessons Learned

### Technical Lessons

| Lesson | Context | Application |
|--------|---------|-------------|
| Product workflows should drive architecture | Dating apps require connected onboarding, moderation, feed, chat, and payments. | Keep domain services aligned with user journeys. |
| Real-time chat is more than sockets | Auth, persistence, unread state, events, and notifications all interact. | Design message flow end-to-end before coding UI. |
| Media upload affects trust | Photos/videos influence safety and user confidence. | Treat storage, validation, moderation, and routing as one workflow. |

### Process Lessons

| Lesson | Context | Application |
|--------|---------|-------------|
| Documentation should be written progressively | Waiting until the end makes it harder to remember decisions. | Keep ADRs close to implementation work. |
| Local reproducibility matters | Reviewers need to run services without guessing dependencies. | Maintain Docker and README files as part of the product. |

### What Would Be Done Differently

| Area | Current Approach | What Would Change | Why |
|------|-----------------|-------------------|-----|
| Planning | Build many flows first, document at the end. | Write ADR notes during each major decision. | Reduces final documentation effort. |
| Technology | Manual API reference. | Add OpenAPI early. | Keeps docs accurate. |
| Process | Limited frontend automated tests. | Add E2E tests as soon as onboarding/feed stabilize. | Prevents regressions in complex UI flows. |
| Scope | Admin dashboard out of scope. | Define a small moderation dashboard earlier. | Makes safety operations more demonstrable. |

## Personal Growth

### Skills Developed

| Skill | Before Project | After Project |
|-------|---------------|---------------|
| Full-stack architecture | Intermediate | Stronger understanding of service boundaries and frontend structure |
| Laravel backend development | Intermediate | Stronger use of requests, services, DTOs, jobs, events, and migrations |
| React SPA development | Intermediate | Stronger use of routing, state, server queries, shared UI, and Telegram-specific UX |
| DevOps basics | Basic to intermediate | Better Docker, service dependency, and deployment documentation skills |

### Key Takeaways

1. A diploma application should demonstrate complete product workflows, not only isolated technical features.
2. Good documentation explains why decisions were made, not only what libraries were installed.
3. Moderation, payments, storage, and real-time communication introduce product-level complexity that must be handled deliberately.

---

*Retrospective completed: May 3, 2026*
