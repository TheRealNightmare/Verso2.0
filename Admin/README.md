# Verso Admin

A standalone **Laravel 13 + Filament 4** admin panel for Verso. It shares the **same SQLite
database** as the API backend (`BACKEND/verso-api-system/database/database.sqlite`) and adds
moderation tooling on top.

## What it does
- **Book approval** — author uploads arrive as `pending` and stay hidden from readers until an
  admin approves them. Approve / reject (with reason) from the Books resource (default tab =
  "Pending review").
- **User management & bans** — edit users, and ban/unban. Banning sets `banned_at` and **revokes
  the user's API tokens** so they're logged out immediately; the backend also blocks banned logins.
- **Activity monitoring** — dashboard with overview stats, a recently-active list (by
  `last_seen_at`), and per-user drill-down (reading sessions, history, authored books).
- **Community moderation** — view/delete room chat and community-feed messages (private DMs are
  intentionally excluded). Reviews and reading rooms (with members) are also manageable.

## Key rule: this app does NOT own the database schema
The API backend owns all migrations. This app points at the shared SQLite file via `DB_DATABASE`
in `.env` and **must never run `php artisan migrate`**. Schema changes (e.g. the book `status` and
user `banned_at` columns) live in `BACKEND/verso-api-system/database/migrations`.

## Setup
```bash
cd Admin
composer install            # if vendor/ is missing
# .env already points DB_DATABASE at the shared backend sqlite file

# Create (or promote) an admin user — only role='admin' can open the panel:
php artisan admin:create

# Run on a port that won't clash with the API backend:
php artisan serve --port=8001
```
Then open http://localhost:8001/admin and log in.
