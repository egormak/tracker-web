# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Minimal React (Vite + TypeScript + MUI v6) web UI for the Go `tracker-server` REST API. It is also embedded as a Telegram Mini App (see `window.Telegram.WebApp` usage). There is no backend code in this repo — only the frontend client.

## Commands

- `npm install` — install dependencies.
- `npm run dev` — start Vite dev server on `http://localhost:5173`. `/api` is proxied to `http://localhost:3000` (configured in `vite.config.ts`) to avoid CORS against a locally running `tracker-server`.
- `npm run build` — runs `tsc -b` (project-wide type check, no emit) then `vite build`. **This is the required verification step** — there is no test runner or linter configured, so a successful build is the bar for "done."
- `npm run preview` — serve the production build locally on port 5173.

Set `VITE_API_BASE_URL` when the API is not same-origin, e.g. `VITE_API_BASE_URL=http://localhost:3000 npm run dev`. Default is same-origin (`''`), relying on the dev proxy or nginx in production.

There are no tests in this repo. If asked to add them, prefer Vitest + React Testing Library, colocated as `*.test.tsx`/`*.test.ts`.

## Architecture

**Single-page app, no state management library.** Everything is React hooks + local component state; API responses are fetched per-page in `useEffect`, no global cache/store.

- `src/main.tsx` — entrypoint, wraps `App` in `BrowserRouter` and MUI `ThemeProvider`/`CssBaseline`.
- `src/App.tsx` — defines all routes and the responsive navigation shell: a top `Header` on desktop, a fixed `BottomNavigation` + secondary-actions `Drawer` on mobile. Also owns Telegram WebApp lifecycle: calls `ready()`/`expand()` on mount, and wires the Telegram `BackButton` to `navigate(-1)` whenever the route isn't `/`.
- `src/api/client.ts` — the single source of truth for backend interaction. Contains every DTO interface (aligned with the tracker-server's `openapi.yml`) and a flat `api` object of typed request wrappers grouped by domain (stats, records, plan-percent, rest, manage, timer, schedule, running-timer). All fetches go through one `request<T>()` helper that JSON-encodes bodies, JSON-parses responses, throws `Error(message)` on non-2xx, and attaches `X-Telegram-Init-Data` from `window.Telegram.WebApp.initData` when running inside Telegram. New endpoints should be added here, not inlined in a page.
- `src/pages/*.tsx` — one file per route, each self-contained: fetches its own data, holds its own form/loading/error state, renders with MUI components. `Dashboard.tsx`, `Schedule.tsx`, and `Timer.tsx` are the largest/most complex (weekly analytics, drag-oriented weekly schedule editor, and concurrent running-task timers respectively).
- `src/components/` — shared presentational pieces (`Card`, `Header`, `Alert`, `Progress`, `PlanPercents`). Keep these free of page-specific business logic.
- `src/theme.ts` — single dark MUI theme (indigo/cyan palette, glassmorphism-style card/appbar gradients, pill-shaped buttons). UI additions should reuse theme tokens/`sx` overrides rather than hardcoding colors.
- `src/utils/format.ts` — small formatting helpers (e.g. `formatRestMinutes` — note the API returns rest time as an integer scaled by 100, i.e. divide by 100 for minutes).

### Legacy vs current endpoints

The API has some duplicated/legacy surfaces from prior iterations — notably `/api/v1/manage/procents` and `/api/v1/task/plan-percent/change` are legacy counterparts to newer plan-percent endpoints. `Plan.tsx`/`PlanPercents.tsx` deal with both; when touching plan-percent logic, check which endpoint variant is actually being called before assuming behavior.

### Running-timer model

`Timer.tsx` supports multiple concurrent running tasks (`RunningTask[]` from `/api/v1/timer/run/list`), each rendered via a `TaskTimerItem` subcomponent that ticks its own elapsed time locally (`setInterval`, 1s) and syncs against `accumulated`/`is_running` from the server. The page as a whole polls `/api/v1/timer/run/status`-style state every 5s. Follow this pattern (local tick + periodic server reconciliation) for any new live-updating timer UI rather than re-fetching every second.

### Telegram Mini App integration

`window.Telegram.WebApp` types are declared globally in `src/vite-env.d.ts`. Any Telegram-specific behavior (back button, init data auth header, color scheme/theme params) should guard on `window.Telegram?.WebApp` being present, since the app also runs standalone in a normal browser.

## Coding conventions

- TypeScript `strict` mode. Two-space indentation, single quotes, no semicolons.
- React function components; PascalCase filenames for components/pages (`Dashboard.tsx`); camelCase for functions/variables/API methods.
- Use MUI `sx` props for component-local styling; avoid new CSS files (only `src/styles.css` exists for app-wide styles).
- Keep API DTOs in `src/api/client.ts` unless a type becomes genuinely shared/complex enough to warrant its own module.

## Deployment

- `Dockerfile` builds the app with Vite (accepting `VITE_API_BASE_URL` as a build arg) and serves the static output via nginx (`nginx.conf`), which proxies `/api` at container runtime to `TRACKER_SERVER_URL` (env var, default `http://api:3000`).
- `.github/workflows/docker-image.yml` builds on every push/PR to `main`; on push to `main` it publishes `ghcr.io/egormak/tracker-web:<YYYY-MM-DD>` and `:latest`.
