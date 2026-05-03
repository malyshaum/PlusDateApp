<!-- prev: index.md | next: stakeholders.md -->

# Problem Statement & Goals

## Context

PlusDateApp operates in the dating and social discovery domain. A dating product has to solve several connected problems at once: user identity, profile quality, discovery, preference filtering, matching, communication, moderation, media storage, and monetization. Users expect a simple mobile experience, but the system behind it must enforce safety rules, keep profile data consistent, deliver chat updates quickly, and avoid showing unsuitable profiles.

The project uses Telegram as the entry point. This decision fits the target context because many users already have Telegram installed and can open a Mini App without installing a separate native application. The backend keeps the business logic in a Laravel API, while the frontend focuses on Telegram-specific UX and mobile navigation.

## Problem Statement

**Who:** Telegram users who want to meet people through a lightweight mobile dating experience.

**What:** They need profile creation, search preferences, safe media validation, swipe discovery, matches, chat, and premium functions in one reliable flow.

**Why:** If these functions are separated or poorly integrated, users drop out during onboarding, receive irrelevant profiles, cannot trust profile media, or lose conversation context after matching.

### Pain Points

| # | Pain Point | Severity | Current Workaround |
|---|------------|----------|-------------------|
| 1 | Registration and profile setup can take too long in standalone apps. | High | Users skip setup, use incomplete profiles, or abandon the app. |
| 2 | Discovery quality depends on location, age, interests, activity, media, and moderation status. | High | Users manually inspect many irrelevant profiles. |
| 3 | Unsafe or low-quality profile media reduces trust. | High | Platforms rely on delayed manual moderation or weak upload rules. |
| 4 | Matches lose value when messaging is slow or not synchronized. | Medium | Users switch to external messengers immediately. |
| 5 | Premium functions must be monetized without breaking the mobile flow. | Medium | Users are sent to external checkout pages with extra friction. |

### Before / After

| Aspect | Before | After |
|--------|--------|-------|
| User entry | User installs or opens a separate dating app, creates credentials, and repeats profile data. | User opens a Telegram Mini App and authenticates through Telegram login data. |
| Profile quality | Profiles can be incomplete, unverified, or contain unsuitable media. | Onboarding, verification photo, media upload rules, and moderation checks improve profile quality. |
| Discovery | Users browse generic lists with limited filtering. | Feed uses search preferences, location ordering, hidden swiped profiles, and profile status filters. |
| Communication | Matching and messaging may be separated. | Match creation and chat features are part of the same backend domain. |
| Monetization | Premium access is difficult to test and maintain. | Stripe Cashier and Telegram invoice flows are separated behind subscription services. |

## Business Goals

| Goal | Description | Success Indicator |
|------|-------------|-------------------|
| Reduce onboarding friction | Allow users to start from Telegram and complete a guided profile setup. | User reaches the feed only after required onboarding fields and moderation checks. |
| Improve discovery relevance | Filter feed profiles using preferences, moderation state, previous swipes, and location data. | Feed returns profiles that match stored preferences and excludes already swiped profiles. |
| Support safe interactions | Add media validation, moderation state, profile visibility rules, and account deletion. | Invalid media or unresolved moderation blocks normal feed access. |
| Enable real-time communication | Allow matched users to chat and receive message/read updates. | Message events are broadcast through Laravel Reverb/private channels. |
| Prepare monetization | Add premium features and subscription flows. | Premium page, subscription endpoints, Stripe Cashier, and Telegram invoice path exist. |

## Objectives & Metrics

| Objective | Metric | Current Value | Target Value | Timeline |
|-----------|--------|---------------|--------------|----------|
| Complete onboarding flow | Required onboarding screens implemented | Implemented | 100% of required profile fields covered | Diploma scope |
| Keep feed relevant | Feed filters supported | Age, city, gender, activity, height, eye color, hobbies, premium, video | At least 8 filter types | Diploma scope |
| Protect media quality | Moderation states and upload validation | Implemented in backend requests, rules, jobs, and moderation screens | All profile media goes through validation/moderation path | Diploma scope |
| Deliver chat interactions | Core chat operations | Create chat, list chats, send messages, read states | Real-time send and read events | Diploma scope |
| Make deployment reproducible | Container assets | Backend, SPA, database Docker assets | Docker-based local deployment for all major services | Diploma scope |

## Success Criteria

### Must Have

- Profile onboarding stores the required user, preference, and media data.
- Feed returns paginated profiles and respects already-swiped exclusions.
- Users can like, dislike, match, respond to likes, and delete matches.
- Users can create chats, send messages, and mark messages as read.
- Media upload and moderation flows prevent unsafe profiles from normal access.
- Backend and frontend can be built and run from documented commands.

### Nice to Have

- Premium filters and limits are visible in the user interface.
- Telegram bot notifications are sent for important events.
- Account deletion and restore flows are available.
- Analytics events can be emitted through Google Tag Manager.

## Non-Goals

The project does not aim to implement a native iOS or Android application, a full manual moderation back office, public social networking posts, group chats, machine-learning recommendations beyond vector-ready database support, or a complete production CI/CD pipeline with managed cloud infrastructure.
