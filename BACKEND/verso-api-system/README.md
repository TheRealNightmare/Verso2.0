# Verso 2.0 — Backend API

The Laravel 13 REST API that powers Verso 2.0. It handles authentication, books and
reading data, reviews, the community chat (via Laravel Reverb WebSockets), queued jobs,
and the Gemini-powered AI features (recommendations and spoiler detection).

This is one half of the project — see the [root README](../../README.md) for the full
overview and the [frontend app](../../FRONTEND/verso).

## Tech stack

- **Laravel 13** (PHP 8.3)
- **Laravel Sanctum** — token authentication
- **Laravel Reverb** — WebSocket server for realtime chat & presence
- **Queued Jobs** — background work, including AI spoiler detection (`DetectSpoilerJob`)
- **Services** — `GeminiService`, `RecommendationService`, `BookParser`
- **smalot/pdfparser** — PDF text extraction
- **MySQL / MariaDB** (SQLite supported)

## Requirements

- PHP 8.3+
- Composer 2
- MySQL 8 / MariaDB (or SQLite)

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
```

### Database (MySQL — primary path)

```sql
CREATE DATABASE verso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=verso
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password
```

> **SQLite alternative:** keep `DB_CONNECTION=sqlite` and run `touch database/database.sqlite`.

Then migrate and link storage:

```bash
php artisan migrate          # add --seed for seed data
php artisan storage:link
```

### Reverb (realtime)

The `.env.example` includes Reverb defaults. Ensure broadcasting targets Reverb:

```dotenv
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

The frontend must use the same `REVERB_APP_KEY`.

### Gemini AI (optional)

Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey):

```dotenv
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

Leave `GEMINI_API_KEY` blank to disable AI recommendations and spoiler detection — both
degrade gracefully.

## Running

Run these in separate terminals:

```bash
php artisan serve            # REST API  → http://localhost:8000
php artisan reverb:start     # WebSockets → ws://localhost:8080
php artisan queue:listen     # queued jobs (incl. spoiler detection)
```

> `composer dev` runs the server, queue, logs, and Vite concurrently (run
> `reverb:start` separately for realtime).

## Useful commands

| Command | Description |
| --- | --- |
| `composer dev` | API server + queue + logs + Vite together |
| `composer test` | Clear config and run the PHPUnit suite |
| `php artisan migrate` | Run database migrations |
| `php artisan reverb:start` | Start the Reverb WebSocket server |
| `php artisan queue:listen` | Process queued jobs |

## Key endpoints

- `POST /api/register`, `POST /api/login` — authentication
- `GET /api/recommendations/books` — AI book recommendations
- `GET /api/recommendations/people` — AI people recommendations
- Community, books, reviews, favorites, history, events, todos, uploads — see
  [`routes/api.php`](routes/api.php)
