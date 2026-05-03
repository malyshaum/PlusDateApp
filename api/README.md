# PlusDate API

Laravel backend for PlusDateApp.

## Stack

- Laravel 12
- PHP 8.2+
- Sanctum for authentication
- Reverb / broadcast channels for realtime features
- Redis for queues and cache
- PostgreSQL with PostGIS support
- MinIO / external storage integrations
- Telegram bot and webhook integrations
- Stripe Cashier for subscriptions

## Main Responsibilities

- Telegram login and auth session management.
- User profile creation, updates, photos, files, and onboarding.
- Discovery feed, swipes, likes, and matches.
- Chat creation, messages, read states, and recent conversations.
- Moderation and photo validation flows.
- Payment and subscription management.
- Dictionary endpoints for countries, cities, activities, and hobbies.
- Admin and bot hooks.

## Key Folder Structure

- [app/Http/Controllers/](app/Http/Controllers/) - API controllers by domain.
- [app/Services/](app/Services/) - business logic and workflows.
- [app/Dto/](app/Dto/) - request/response data objects.
- [app/Models/](app/Models/) - domain models.
- [app/Mapping/](app/Mapping/) - AutoMapper mappings.
- [app/Rules/](app/Rules/) - validation and access rules.
- [database/migrations/](database/migrations/) - schema changes.
- [routes/api.php](routes/api.php) - public and protected API routes.
- [config/](config/) - application configuration.

## API Areas

### Authentication

- `POST /login`
- `GET /me`

### User

- profile reading and updating
- preferences
- photos and files
- video upload and deletion
- stats and onboard flow
- account deletion

### Dictionary

- cities
- countries
- activities
- hobbies

### Feed

- swipe
- revert swipe
- profiles
- delete match
- respond to likes

### Chat

- create chat
- list user chats
- fetch messages
- send message
- mark message read
- recent chats

### Storage

- upload photo
- upload video
- delete file

### Payment

- current subscription
- subscribe
- cancel subscription
- Telegram invoice

### Moderation

- validate user profile photos
- update files with moderation

### Admin

- create bot profile
- delete user account

## Local Setup

1. Copy the environment file.
2. Install dependencies.
3. Start the API with Docker or a local PHP server.
4. Run migrations and seeders if needed.

### Docker

The backend docker stack includes API, Postgres, Redis, and MinIO.

```bash
docker compose up -d --build
```

### Local Development

```bash
composer install
npm install
php artisan key:generate
php artisan migrate
php artisan serve
```

## Useful Commands

```bash
php artisan test
php artisan config:clear
php artisan route:list
php artisan queue:listen --tries=1
php artisan pail --timeout=0
```

## Environment Variables

Important variables include:

- `APP_NAME`
- `APP_URL`
- `DB_CONNECTION`
- `DB_HOST`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `REDIS_HOST`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- Telegram and Stripe credentials

## Notes

- Realtime routes and private channels are configured for chat and user updates.
- The backend expects PostgreSQL extensions used by the database layer.
- File uploads are handled through service abstractions and validation rules.
