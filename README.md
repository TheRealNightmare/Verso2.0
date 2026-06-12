# Verso 2.0

> An online book-reading and digital library platform — read EPUB/PDF books in the
> browser, read together in collaborative rooms, get AI-powered recommendations, and
> moderate it all from a dedicated admin panel.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![Filament](https://img.shields.io/badge/Filament-4-FDAE4B?logo=laravel&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

## About

Verso 2.0 is a full-stack web application for reading and managing digital books. Readers
open EPUB and PDF titles directly in the browser, build a personal library, highlight and
annotate passages, listen with a built-in text-to-speech narrator, rate and review books,
and track their progress on a stats dashboard. A social layer adds a real-time community
chat, friendships and direct messages, and **collaborative reading rooms** where a group
reads the same book together with shared highlights, threaded discussion, and live
presence. **Google Gemini** powers book/people recommendations, an in-context reading
assistant, and automatic spoiler detection in chat.

Built as an **academic / university project**, Verso 2.0 is composed of **three
independent applications** that share a single database:

| App | Folder | Role |
| --- | --- | --- |
| **Frontend** | [`FRONTEND/verso`](FRONTEND/verso) | React single-page app — the reader UI |
| **Backend API** | [`BACKEND/verso-api-system`](BACKEND/verso-api-system) | Laravel REST API + Reverb websockets + queued jobs |
| **Admin** | [`Admin`](Admin) | Laravel + Filament moderation panel |

## Features

### 📖 Reading & library
- **In-browser readers** for EPUB and PDF, powered by epub.js and pdf.js.
- **Personal uploads** — upload your own EPUB/PDF files and read them in the same reader.
- **Highlights & annotations** — select text to highlight in colors and attach notes.
- **Narrator (text-to-speech)** — have the book read aloud with selectable **voice** and
  **playback speed** controls.
- **Reader preferences** — adjustable font scale, light/dark theme, and ambient ASMR audio.
- **Library tools** — favorites, bookmarks, and reading history with per-book progress.
- **Reviews & ratings** — leave star ratings and written reviews on any title.

### 📊 Reading dashboard
- Charts and statistics on your reading activity (pages, sessions, streaks) rendered with
  Recharts.

### 💬 Community & social
- **Community chat** — a global, real-time chat with emoji reactions.
- **Friendships** — send, accept, and decline friend requests.
- **Direct messages** — private friend-to-friend messages with read receipts.

### 👥 Collaborative reading rooms
- **Reading rooms** scoped to a single book, so a group can read together.
- **Room chat**, **shared highlights**, and **threaded comments** on each highlight.
- **Live presence** — see who's online and which page each member is on.
- **Persistent room invitations** — invite anyone (not just friends) with clickable
  in-app notifications that survive across sessions.

### 🤖 AI (Google Gemini)
- **Recommendations** — personalised book and people suggestions.
- **Reading assistant** — ask questions about a highlighted passage and get answers in
  context.
- **Spoiler detection** — community and room messages are automatically scanned and
  flagged for spoilers via a queued background job.

### 🖋️ Authoring
- **Author dashboard** — authors publish books and manage their own titles.

### 🛡️ Moderation & admin
- **Book approval workflow** — submitted books move through **pending → approved /
  rejected** (with a rejection reason) before appearing publicly.
- **User ban system** — ban/unban users with a reason; the `CheckBanned` middleware blocks
  banned users from the API and from logging in.
- **Filament admin panel** — manage **users**, **books**, **reviews**, **community
  messages**, **reading rooms**, and **room messages** from one dashboard.

### 🎓 Learning & extras
- **Quizzes & lessons**, an **events calendar**, personal **todos**, and a user **points**
  system.

### 🔐 Accounts
- Token-based authentication (Laravel Sanctum) with **role-based access**: `reader`,
  `author`, and `admin`.

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite 8, TypeScript + JSX, Tailwind CSS 4, React Router 7, Recharts, epub.js, pdf.js, Laravel Echo + Pusher JS |
| **Backend API** | Laravel 13 (PHP 8.3), Laravel Sanctum (auth), Eloquent ORM, queued Jobs, `smalot/pdfparser` (PDF text extraction) |
| **Admin** | Laravel 13 + Filament 4 |
| **Realtime** | Laravel Reverb (WebSocket server) + Laravel Echo / Pusher JS on the client |
| **AI** | Google Gemini API (`gemini-2.5-flash`) for recommendations, the reading assistant, and spoiler detection |
| **Database** | MySQL 8 / MariaDB (SQLite supported for a quick start) |

## Architecture

The three apps are deployed separately but talk to one shared database. The React SPA
calls the REST API over HTTP and subscribes to Reverb for realtime events; the Admin panel
reads and writes the **same** database the API uses.

```
                         ┌─────────────────────────┐
   Browser (reader)  ───▶│  React SPA  (Vite :5173) │
                         └───────────┬─────────────┘
                          HTTP /api  │  WebSocket
                                     ▼
              ┌──────────────────────────────────────────┐
              │  Laravel Backend  (verso-api-system)      │
              │  • REST API           → http://localhost:8000
              │  • Reverb (realtime)  → ws://localhost:8080
              │  • Queue worker (AI spoiler jobs)         │
              └───────────────────┬──────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   MySQL database │  (shared)
                         └────────▲─────────┘
                                  │
              ┌───────────────────┴──────────────────────┐
              │  Laravel + Filament Admin  (:8001 /admin) │
              └──────────────────────────────────────────┘
```

> The **Admin** app has no schema migrations of its own — it operates directly on the
> backend's database. Point both apps' `.env` at the same database.

## Project structure

```
Verso2.0/
├── FRONTEND/
│   └── verso/                      # React + Vite single-page app
│       └── src/
│           ├── api/                # API client modules (auth, books, rooms, chat, …)
│           ├── pages/              # Route pages (Home, ReadingPage, Community, ReadingRooms, …)
│           ├── components/         # UI: reader/, reader/narrator/, room/, community/, dashboard/
│           ├── context/            # React context providers (auth, user)
│           ├── hooks/              # Custom React hooks
│           └── lib/                # Shared helpers (e.g. Echo client)
│
├── BACKEND/
│   └── verso-api-system/           # Laravel REST API + Reverb
│       ├── app/
│       │   ├── Http/Controllers/   # API controllers (Room, Community, Recommendation, …)
│       │   ├── Http/Middleware/    # CheckBanned, …
│       │   ├── Models/             # Eloquent models
│       │   ├── Events/             # Broadcast events (realtime, spoiler flags)
│       │   ├── Jobs/               # Queued jobs (DetectSpoilerJob, RoomDetectSpoilerJob)
│       │   └── Services/           # GeminiService, RecommendationService, BookParser
│       ├── routes/                 # api.php, channels.php, web.php
│       └── database/               # Migrations & seeders
│
└── Admin/                          # Laravel + Filament admin panel (path: /admin)
    └── app/
        ├── Filament/Resources/     # Users, Books, Reviews, CommunityMessages,
        │                           #   ReadingRooms, RoomMessages
        └── Providers/Filament/     # AdminPanelProvider.php (brand "Verso Admin")
```

Each app also has its own README in its folder.

## Running locally

The frontend, backend, and admin panel run as three separate apps. Follow the steps in
order — the backend (and its database) comes first because the other two depend on it.

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
> `touch database/database.sqlite` — no database server needed. (Remember the Admin app
> must then point at this **same** SQLite file.)

**Run migrations and link storage** (the storage link serves uploaded book files):

```bash
php artisan migrate          # add --seed if you want seed data
php artisan storage:link
```

**Configure Reverb (realtime WebSockets).** Make sure broadcasting points at Reverb:

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

> Leave `GEMINI_API_KEY` blank to disable AI recommendations, the reading assistant, and
> spoiler detection — those features degrade gracefully and the rest of the app works
> normally.

**Start the backend.** It needs three processes; open three terminals (all from
`BACKEND/verso-api-system`):

```bash
php artisan serve            # REST API  → http://localhost:8000
php artisan reverb:start     # WebSockets → ws://localhost:8080 (realtime chat & presence)
php artisan queue:listen     # processes queued jobs, incl. AI spoiler detection
```

> **Tip:** `composer dev` runs the server, queue, log tailer, and Vite concurrently in a
> single terminal (note: it starts Vite, not Reverb — you still run `reverb:start`
> separately for realtime).

### 2. Admin panel — Laravel + Filament (`Admin`)

The admin panel shares the backend's database, so its `.env` must use the **same DB
credentials** you set above. It does **not** have its own data migrations to run.

```bash
cd ../../Admin                # from BACKEND/verso-api-system

composer install
cp .env.example .env
php artisan key:generate
```

Edit the Admin `.env` so the `DB_*` values match the backend (same MySQL database, or the
same SQLite file). Then run it on a **different port** (8000 is the API):

```bash
php artisan serve --port=8001     # admin panel → http://localhost:8001/admin
```

> Filament ships compiled assets, so this is enough. To customise the admin theme, run
> `npm install && npm run build` in `Admin/` as well.

### 3. Create an admin account

The Filament panel only lets in users whose `role` is `admin`. Create a normal account
first — register through the app once the frontend is running (step 4), or create one
directly with `php artisan make:filament-user` from `Admin/` — then promote it to admin.

From **either** the `Admin` or `BACKEND/verso-api-system` folder (they share the database):

```bash
php artisan tinker --execute="App\Models\User::where('email','you@example.com')->update(['role'=>'admin']);"
```

Now log in at **http://localhost:8001/admin** with that account.

### 4. Frontend — React app (`FRONTEND/verso`)

```bash
cd ../FRONTEND/verso          # from Admin

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

### 5. Open the app

Visit **http://localhost:5173**, register an account, and start reading. Moderators manage
the platform at **http://localhost:8001/admin**.

### Troubleshooting

- **Chat / presence is silent:** the frontend `VITE_REVERB_APP_KEY` must match the backend
  `REVERB_APP_KEY`, and `php artisan reverb:start` must be running.
- **Spoilers never get flagged:** make sure `php artisan queue:listen` is running and a
  valid `GEMINI_API_KEY` is set.
- **No AI recommendations / assistant:** confirm `GEMINI_API_KEY` is set (these features
  are disabled when it's blank).
- **API requests fail / CORS errors:** check `VITE_API_URL` points at the running API
  (`http://localhost:8000/api`).
- **Can't log into `/admin`:** the account needs `role = 'admin'` (and must not be banned),
  and the Admin app's `.env` must point at the **same** database as the backend.

## Available scripts

**Backend** (`BACKEND/verso-api-system`):

| Command | Description |
| --- | --- |
| `composer dev` | Run API server, queue worker, log tailer, and Vite together |
| `composer test` | Clear config and run the test suite |
| `php artisan serve` | Start the REST API on port 8000 |
| `php artisan reverb:start` | Start the Reverb WebSocket server on port 8080 |
| `php artisan queue:listen` | Process queued jobs (e.g. spoiler detection) |

**Admin** (`Admin`):

| Command | Description |
| --- | --- |
| `php artisan serve --port=8001` | Start the Filament admin panel at `/admin` |
| `php artisan make:filament-user` | Create a panel user (then promote to `role = admin`) |
| `npm run build` | Build the custom admin theme assets (optional) |

**Frontend** (`FRONTEND/verso`):

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest suite |

---

See each app's own README for more detail:
[FRONTEND/verso](FRONTEND/verso) ·
[BACKEND/verso-api-system](BACKEND/verso-api-system) ·
[Admin](Admin)
