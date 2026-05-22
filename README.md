# Verso 2.0

> An online book-reading and digital library platform — read EPUB/PDF books in the browser, track your reading, review titles, and connect with a community of readers.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## About

Verso 2.0 is a full-stack web application for reading and managing digital books.
Users can read EPUB and PDF titles directly in the browser, build a personal
library, annotate and bookmark passages, rate and review books, follow their
reading progress through a stats dashboard, and chat with other readers in real
time.

This project was built as an **academic / university project** and is split into
two independent applications: a React single-page frontend and a Laravel REST API
backend.

## Features

- 📖 **Read online** — in-browser EPUB and PDF reader
- ⭐ **Personal library** — favorites, bookmarks, reading history & reading sessions
- ✍️ **Annotations** — highlight and annotate while you read
- 💬 **Reviews & ratings** — leave star ratings and comments on books
- 📊 **Reading dashboard** — charts and stats on your reading activity
- 👥 **Community chat** — real-time messages and reactions
- 📅 **Events** — browse an events calendar and create events
- ✅ **Todos** — keep a personal reading to-do list
- 🎓 **Quizzes & lessons** — built-in learning module
- ⬆️ **User uploads** — upload your own files and read them
- 🔐 **Accounts** — registration, login, and protected routes

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite 8, TypeScript + JSX, Tailwind CSS 4, React Router 7, Recharts, epub.js, pdf.js, Laravel Echo + Pusher |
| **Backend** | Laravel 13 (PHP 8.3), Laravel Reverb (WebSockets), Eloquent ORM |

## Project structure

```
Verso2.0/
├── FRONTEND/
│   └── verso/                  # React + Vite single-page app
│       └── src/
│           ├── api/            # API client modules (auth, books, reviews, …)
│           ├── pages/          # Route pages (Home, ReadingPage, Community, …)
│           ├── components/     # Reusable UI components
│           ├── context/        # React context providers
│           └── hooks/          # Custom React hooks
│
└── BACKEND/
    └── verso-api-system/       # Laravel REST API + Reverb
        ├── app/
        │   ├── Http/Controllers/  # API controllers
        │   ├── Models/            # Eloquent models
        │   └── Events/            # Broadcast events (realtime)
        ├── routes/                # api.php, channels.php, web.php
        └── database/              # Migrations & seeders
```

See [FRONTEND/verso](FRONTEND/verso) and
[BACKEND/verso-api-system](BACKEND/verso-api-system) for each app.

## Getting started (overview)

The two apps run separately. This is a high-level overview — refer to the
standard Laravel and Vite workflows for the exact commands.

**Requirements:** Node.js, PHP 8.3+, and Composer.

**Backend** ([BACKEND/verso-api-system](BACKEND/verso-api-system)) — a Laravel
API: install Composer dependencies, copy `.env` and generate an app key, run the
database migrations, then serve the API and start the Reverb WebSocket server for
realtime features.

**Frontend** ([FRONTEND/verso](FRONTEND/verso)) — a Vite app: install npm
dependencies, configure the environment variables, and start the dev server with
`npm run dev`. The frontend `.env` expects:

- `VITE_API_URL` — base URL of the backend API
- `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME` — Reverb (realtime) connection settings

## Credits

Academic project by:

- _Add team member names here_

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).
A `LICENSE` file should be added at the repository root.
