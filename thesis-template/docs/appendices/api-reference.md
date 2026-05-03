<!-- prev: glossary.md | next: db-schema.md -->

# API Reference

## Overview

Base URL for local development: `http://localhost:8000/api`

Authentication: Telegram login followed by Laravel Sanctum-protected requests. Public routes are limited to login, Telegram webhooks, moderation webhook, and healthcheck.

## Public Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/login` | Authenticate or create a user from Telegram login data. |
| POST | `/telegram/webhook` | Receive Telegram bot webhook events. |
| POST | `/telegram/moderation/webhook` | Receive Telegram moderation webhook events. |
| GET | `/healthcheck` | Return API health status. |

Example healthcheck response:

```json
{
  "status": "ok"
}
```

## Authenticated Endpoint Groups

All endpoints below are inside the `auth:sanctum` and `RecordActivityMiddleware` route group.

### Current User

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Return the authenticated user profile state. |

### Moderation

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/moderation/user-profile/photos` | Validate current user's profile photos. |

### Dictionary

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/dictionary/cities` | List cities. |
| GET | `/dictionary/countries` | List countries. |
| GET | `/dictionary/activities` | List activities. |
| GET | `/dictionary/hobbies` | List hobbies. |

### User Profile

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/user/{id}` | Get another user's profile by numeric ID. |
| POST | `/user/profile` | Create or update profile information. |
| PUT | `/user/search/preferences` | Update search preferences. |
| GET | `/user/likes` | Get incoming likes. |
| POST | `/user/photos` | Update profile photos. |
| POST | `/user/photo/{photoId}/main` | Set main profile photo. |
| GET | `/user/files` | List current user's files. |
| POST | `/user/files` | Update files with moderation workflow. |
| POST | `/user/files/video` | Upload user video. |
| DELETE | `/user/files/video/{id}` | Delete user video. |
| GET | `/user/swipes` | Get available swipes or limits. |
| GET | `/user/stats` | Get user statistics. |
| POST | `/user/onboard` | Complete onboarding. |
| DELETE | `/user/account` | Delete account. |

### Feed

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/feed/swipe` | Store a like/dislike decision. |
| POST | `/feed/swipe/revert` | Revert a previous swipe when allowed. |
| GET | `/feed/profiles` | Get feed profiles with cursor pagination and filters. |
| DELETE | `/feed/match` | Delete an existing match. |
| POST | `/likes/respond` | Accept or reject an incoming like. |

### Chat

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/chat` | Create or get chat between two users. |
| GET | `/chat` | List current user's chats. |
| GET | `/chat/{chat_id}/message` | Get chat messages with cursor pagination. |
| POST | `/chat/message` | Send message. |
| PUT | `/chat/message` | Mark message as read. |
| GET | `/chat/recent` | Get recent chats. |

### Storage

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/storage/file/photo` | Upload photo file. |
| POST | `/storage/file/video` | Upload video file. |
| DELETE | `/storage/file` | Delete stored file. |

### Payment

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/payment/subscription` | Get current subscription. |
| POST | `/payment/subscription/cancel` | Cancel subscription. |
| POST | `/payment/subscribe` | Start subscription flow. |
| POST | `/payment/telegram/invoice` | Send Telegram invoice. |

### Admin

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/admin/create-bot` | Create a bot/test profile. |
| DELETE | `/admin/user/{user_id}` | Delete user account as admin. |

## Common Error Responses

| Status Code | Meaning | Typical Cause |
|-------------|---------|---------------|
| 200 | Success | Request completed. |
| 201 | Created | Resource was created. |
| 401 | Unauthorized | Missing or invalid authentication. |
| 403 | Forbidden | Domain rule blocks the action. |
| 404 | Not Found | Resource does not exist or is not visible to user. |
| 422 | Validation Error | Request body or file failed validation. |
| 500 | Server Error | Unexpected backend error or missing service configuration. |

## OpenAPI Status

There is no generated Swagger/OpenAPI file committed in the repository. This reference is based on `api/routes/api.php` and should be replaced or supplemented with generated OpenAPI documentation before production release.
