# Verso 2.0 — Frontend

The React 19 + Vite single-page app for Verso 2.0. It provides the in-browser EPUB/PDF
readers, the reading dashboard, community chat (via Laravel Echo + Reverb), AI
recommendations, author tools, and the rest of the UI.

This is one half of the project — see the [root README](../../README.md) for the full
overview and the [backend API](../../BACKEND/verso-api-system).

## Tech stack

- **React 19** + **Vite 8** (TypeScript + JSX)
- **Tailwind CSS 4**
- **React Router 7**
- **Recharts** — dashboard charts
- **epub.js** & **pdf.js** — in-browser readers
- **Laravel Echo** + **Pusher JS** — realtime (connects to backend Reverb)

## Requirements

- Node.js 20+ (verified on Node 24) and npm
- A running [backend API](../../BACKEND/verso-api-system)

## Setup

```bash
npm install
```

Create (or confirm) `.env` in this folder:

```dotenv
VITE_API_URL=http://localhost:8000/api

VITE_REVERB_APP_KEY=your_app_key   # must match backend REVERB_APP_KEY
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend REST API |
| `VITE_REVERB_APP_KEY` | Reverb app key — must match the backend `REVERB_APP_KEY` |
| `VITE_REVERB_HOST` | Reverb host (e.g. `localhost`) |
| `VITE_REVERB_PORT` | Reverb port (default `8080`) |
| `VITE_REVERB_SCHEME` | `http` for local dev |

## Running

```bash
npm run dev                  # app → http://localhost:5173
```

Make sure the backend (`php artisan serve`) and Reverb (`php artisan reverb:start`) are
running so the API calls and realtime chat work.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Project layout

```
src/
├── api/          # API client modules (auth, books, recommendations, …)
├── pages/        # Route pages (Home, ReadingPage, Community, AuthorDashboard, …)
├── components/   # Reusable UI components (incl. PeopleRecommendations)
├── context/      # React context providers
├── hooks/        # Custom React hooks
└── lib/          # Shared helpers (e.g. Echo client)
```
