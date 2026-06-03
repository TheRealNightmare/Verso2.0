# Verso 2.0

> An online book-reading and digital library platform — read EPUB/PDF books in the
> browser, track your reading, review titles, get AI-powered recommendations, and
> connect with a community of readers.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

## About

Verso 2.0 is a full-stack web application for reading and managing digital books.
Users can read EPUB and PDF titles directly in the browser, build a personal library,
annotate and bookmark passages, rate and review books, follow their reading progress
through a stats dashboard, and chat with other readers in real time. It also ships
with **Gemini-powered AI features** — personalised book/people recommendations and
automatic spoiler detection in community chat.

This project was built as an **academic / university project** and is split into two
independent applications: a React single-page frontend and a Laravel REST API backend.

## Features

- 📖 **Read online** — in-browser EPUB and PDF reader
- ⭐ **Personal library** — favorites, bookmarks, reading history & reading sessions
- ✍️ **Annotations** — highlight and annotate while you read
- 💬 **Reviews & ratings** — leave star ratings and comments on books
- 📊 **Reading dashboard** — charts and stats on your reading activity
- 👥 **Community chat** — real-time messages and reactions
- 🤖 **AI recommendations** — Gemini-powered book & people suggestions
- 🚫 **AI spoiler detection** — community messages are automatically flagged for spoilers
- 🖋️ **Author tools** — author dashboard, publish books, and manage your titles
- 📅 **Events** — browse an events calendar and create events
- ✅ **Todos** — keep a personal reading to-do list
- 🎓 **Quizzes & lessons** — built-in learning module
- ⬆️ **User uploads** — upload your own files and read them
- 🔐 **Accounts** — registration, login (Sanctum), and protected routes

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite 8, TypeScript + JSX, Tailwind CSS 4, React Router 7, Recharts, epub.js, pdf.js, Laravel Echo + Pusher JS |
| **Backend** | Laravel 13 (PHP 8.3), Laravel Sanctum (auth), Laravel Reverb (WebSockets), Eloquent ORM, queued Jobs, `smalot/pdfparser` (PDF text extraction) |
| **AI** | Google Gemini API (`gemini-2.5-flash`) for recommendations & spoiler detection |
| **Database** | MySQL / MariaDB (SQLite supported for quick starts) |

## Project structure

```
Verso2.0/
├── FRONTEND/
│   └── verso/                      # React + Vite single-page app
│       └── src/
│           ├── api/                # API client modules (auth, books, recommendations, …)
│           ├── pages/              # Route pages (Home, ReadingPage, Community, AuthorDashboard, …)
│           ├── components/         # Reusable UI components (incl. PeopleRecommendations)
│           ├── context/            # React context providers
│           ├── hooks/              # Custom React hooks
│           └── lib/                # Shared helpers (e.g. Echo client)
│
└── BACKEND/
    └── verso-api-system/           # Laravel REST API + Reverb
        ├── app/
        │   ├── Http/Controllers/   # API controllers (Recommendation, Community, Author, …)
        │   ├── Models/             # Eloquent models
        │   ├── Events/             # Broadcast events (realtime, spoiler flags)
        │   ├── Jobs/               # Queued jobs (DetectSpoilerJob)
        │   └── Services/           # GeminiService, RecommendationService, BookParser
        ├── routes/                 # api.php, channels.php, web.php
        └── database/               # Migrations & seeders
```

See [FRONTEND/verso](FRONTEND/verso) and
[BACKEND/verso-api-system](BACKEND/verso-api-system) for each app's own README.

## Running locally

The frontend and backend run as two separate apps. Follow the steps in order.

### Prerequisites

- **PHP 8.3+**
- **Composer 2**
- **Node.js 20+** (the repo is verified on Node 24) and **npm**
- **MySQL 8 / MariaDB** (or SQLite for a quick start)

> Works on Linux, macOS, and Windows (WSL2 recommended on Windows).

### 0. Clone the repository

```bash
git clone git@github.com:TheRealNightmare/Verso2.0.git
cd Verso2.0
```

### 1. Backend — Laravel API (`BACKEND/verso-api-system`)

```bash
cd BACKEND/verso-api-system

# Install PHP dependencies
composer install

# Create your environment file and app key
cp .env.example .env
php artisan key:generate
```

**Configure the database (MySQL — primary path).** Create a database, then edit `.env`:

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

> **SQLite alternative (quick start):** keep `DB_CONNECTION=sqlite` in `.env` and run
> `touch database/database.sqlite` — no database server needed.

**Run migrations and link storage** (the storage link serves uploaded book files):

```bash
php artisan migrate          # add --seed if you want seed data
php artisan storage:link
```

**Configure Reverb (realtime WebSockets).** The `.env.example` already includes Reverb
defaults; make sure these are present and that broadcasting points at Reverb:

```dotenv
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

> Remember the `REVERB_APP_KEY` value — the frontend must use the **same** key.

**Configure Gemini AI (optional, but enables AI features).** Get a free key from
[Google AI Studio](https://aistudio.google.com/app/apikey), then set in `.env`:

```dotenv
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

> Leave `GEMINI_API_KEY` blank to disable AI recommendations and spoiler detection —
> those features degrade gracefully and the rest of the app works normally.

**Start the backend.** It needs three processes; open three terminals (all from
`BACKEND/verso-api-system`):

```bash
php artisan serve            # REST API  → http://localhost:8000
php artisan reverb:start     # WebSockets → ws://localhost:8080 (realtime chat & presence)
php artisan queue:listen     # processes queued jobs, incl. AI spoiler detection
```

> **Tip:** `composer dev` runs the server, queue, log tailer, and Vite concurrently in
> a single terminal (note: it starts Vite, not Reverb — you still run `reverb:start`
> separately for realtime).

### 2. Frontend — React app (`FRONTEND/verso`)

```bash
cd FRONTEND/verso

# Install JS dependencies
npm install
```

Create (or confirm) `FRONTEND/verso/.env`:

```dotenv
VITE_API_URL=http://localhost:8000/api

VITE_REVERB_APP_KEY=your_app_key   # must match backend REVERB_APP_KEY
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Start the dev server:

```bash
npm run dev                  # app → http://localhost:5173
```

### 3. Open the app

Visit **http://localhost:5173**, register an account, and start reading.

### Troubleshooting

- **Chat / presence is silent:** the frontend `VITE_REVERB_APP_KEY` must match the
  backend `REVERB_APP_KEY`, and `php artisan reverb:start` must be running.
- **Spoilers never get flagged:** make sure `php artisan queue:listen` is running and a
  valid `GEMINI_API_KEY` is set.
- **No AI recommendations:** confirm `GEMINI_API_KEY` is set (features are disabled when
  it's blank).
- **API requests fail / CORS errors:** check `VITE_API_URL` points at the running API
  (`http://localhost:8000/api`).

## Available scripts

**Backend** (`BACKEND/verso-api-system`):

| Command | Description |
| --- | --- |
| `composer dev` | Run API server, queue worker, log tailer, and Vite together |
| `composer test` | Clear config and run the PHPUnit test suite |
| `php artisan serve` | Start the REST API on port 8000 |
| `php artisan reverb:start` | Start the Reverb WebSocket server on port 8080 |
| `php artisan queue:listen` | Process queued jobs (e.g. spoiler detection) |

**Frontend** (`FRONTEND/verso`):

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
