# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Minimal React (Vite + TypeScript + MUI v6) web UI and Telegram Mini App for the Go `tracker-server` REST API. It provides analytics dashboards, weekly schedule editing, plan rotation management, rest tracking, linear warm-up ramp progression, and real-time running-task timers. There is no backend code in this repo — only the frontend client.

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
- `src/api/client.ts` — the single source of truth for backend interaction. Contains every DTO interface (aligned with the tracker-server's `openapi.yml`) and a flat `api` object of typed request wrappers grouped by domain (stats, records, plan-percent, rest, manage, timer, schedule, running-timer, evening-focus, ramp). All fetches go through one `request<T>()` helper that JSON-encodes bodies, JSON-parses responses, throws `Error(message)` on non-2xx, and attaches `X-Telegram-Init-Data` from `window.Telegram.WebApp.initData` when running inside Telegram. New endpoints should be added here, not inlined in a page. Also exports `getTimerWebSocketUrl()`.
- `src/pages/*.tsx` — one file per route, each self-contained: fetches its own data, holds its own form/loading/error state, renders with MUI components.
  - `Dashboard.tsx` — weekly analytics with tabs (overview, daily breakdown, task targets), 24h timeline canvas, role donut chart, Evening Focus card, Today task progress card, and Ramp badge.
  - `Schedule.tsx` — drag/tab weekly schedule editor, rollover and backlog task inspector, schedule activation.
  - `Timer.tsx` — live concurrent running tasks, circular canvas timer, WebSocket sync, audio cues, keyboard shortcuts, sequence modes (percent, backlog, evening combo), batch session runner, duration adjusters, and URL query parameter initialization (`?task=&role=&target=&combo=`).
  - `Plan.tsx` — next task by plan rotation, plan percent group rotation, and procents configuration.
  - `Record.tsx` — manual logging of task duration, source day, and service distribution.
  - `Rest.tsx` — rest balance management (add, spend, reset).
  - `Manage.tsx` — task creation with role assignments.
- `src/components/` — two kinds:
  - Presentational pieces (`Card`, `Header`, `Alert`, `Progress`) hold no business logic.
  - Self-fetching feature widgets (`PlanPercents`, `EveningFocusCard`, `RampBadge`/`RampSettingsModal`, `TodayTaskProgressCard`) call `api` themselves and are dropped into pages as a unit.
- `src/components/canvas/` — hand-drawn `<canvas>` 2D visualizations (`CircularTimerCanvas` on Timer, `Timeline24hCanvas`/`DonutChartCanvas` on Dashboard) that scale for `devicePixelRatio`. There is no chart library; extend these instead of adding one.
- `src/hooks/` — custom React hooks:
  - `useTimerSync.ts` — WebSocket timer client connecting to `/api/v1/timer/ws`, handling real-time task events, exponential backoff reconnection, 25s heartbeats, server clock skew (`serverTimeOffset`), and tab visibility re-sync.
  - `useHotkeys.ts` — keyboard shortcuts (`Space` to toggle play/pause, `1`/`2`/`3` to switch role to work/learn/rest).
- `src/constants/themeColors.ts` — `ROLE_THEMES` holds the per-role (work/learn/rest/other) color set, glow, and Russian labels; `ROLE_COLORS`; `ROLE_TAGS`; `DESIGN_TOKENS`; and `TIMER_PRESETS`.
- `src/utils/` — utility functions:
  - `format.ts` — small formatting helpers (e.g. `formatRestMinutes` — note the API returns rest time as an integer scaled by 100, i.e. divide by 100 for minutes).
  - `audio.ts` — `soundSynth` Web Audio API sound synthesizer for tactile feedback (session start, pause, completion) without external audio files.
- `src/theme.ts` — single dark MUI theme (coral/blue/emerald role colors, glassmorphism-style card/appbar gradients, pill-shaped buttons). UI additions should reuse theme tokens/`sx` overrides rather than hardcoding colors.

### Legacy vs current endpoints

The API has some duplicated/legacy surfaces from prior iterations — notably `/api/v1/manage/procents` and `/api/v1/task/plan-percent/change` are legacy counterparts to newer plan-percent endpoints. `Plan.tsx`/`PlanPercents.tsx` deal with both; when touching plan-percent logic, check which endpoint variant is actually being called before assuming behavior.

### Running-timer model

Live running-task state comes from `src/hooks/useTimerSync.ts`, not from polling:

- On mount it fetches `/api/v1/timer/run/list` once over HTTP. It then opens a WebSocket to `/api/v1/timer/ws`; `getTimerWebSocketUrl()` in `client.ts` builds the URL, passing Telegram `initData` as a query param because WebSockets can't send custom headers.
- Server events (`STATE_SYNC`, `TASK_STARTED`/`PAUSED`/`RESUMED`/`STOPPED`/`ADJUSTED`, `HEARTBEAT_ACK`) patch `runningTasks` in place.
- It reconnects with exponential backoff, sends a heartbeat for the active task every 25s (falling back to `POST /timer/run/heartbeat` when the socket is down), and re-fetches when the tab becomes visible again.
- It tracks `serverTimeOffset` (server clock minus local clock) from each event's `server_time`.
- A `TASK_STOPPED` with a non-`manual` reason triggers the `onServerAutoStop` callback.

In `Timer.tsx`, each `TaskTimerItem` ticks locally every 1s. It computes `accumulated * 60 + (now + serverTimeOffset - start_time)` and calls `onStop` itself once it reaches `target_duration`. For any new live timer UI, reuse `useTimerSync` plus a local tick instead of re-fetching.

`Timer.tsx` also runs two client-side multi-task flows on top of the server timer:

- The evening-focus "combo" chain (`tracker_evening_combo_session`), which expires after 4h.
- The batch session (`tracker_batch_session`).

Both are saved in `localStorage` so they survive reloads. These are the only client-held state in the app. The server still decides what is running; these sessions only decide what to start next.

### Linear Warm-Up Ramp (Warm-Up Ladder 2.0)

- Controlled by `/api/v1/ramp/status`, `/api/v1/ramp/config`, `/api/v1/ramp/reset`, `/api/v1/ramp/advance`.
- Manages daily cap progression (`cap_minutes`, `current_step`) and filters by task role.
- Component state synchronization between `RampBadge` and `RampSettingsModal` uses `window.dispatchEvent(new CustomEvent('ramp-updated', { detail }))`.

### Telegram Mini App integration

`window.Telegram.WebApp` types are declared globally in `src/vite-env.d.ts`. Any Telegram-specific behavior (back button, init data auth header, color scheme/theme params) should guard on `window.Telegram?.WebApp` being present, since the app also runs standalone in a normal browser.

## Coding conventions

- TypeScript `strict` mode. Two-space indentation, single quotes, no semicolons.
- React function components; PascalCase filenames for components/pages (`Dashboard.tsx`); camelCase for functions/variables/API methods.
- Use MUI `sx` props for component-local styling; avoid new CSS files (only `src/styles.css` exists for app-wide styles).
- Commit messages follow Conventional Commits (`feat: …`, `fix: …`), matching the existing history and `AGENTS.md`.
- Keep API DTOs in `src/api/client.ts` unless a type becomes genuinely shared/complex enough to warrant its own module.

## Deployment

- `Dockerfile` builds the app with Vite (accepting `VITE_API_BASE_URL` as a build arg) and serves the static output via nginx (`nginx.conf`), which proxies `/api` at container runtime to `TRACKER_SERVER_URL` (env var, default `http://api:3000`).
- `.github/workflows/docker-image.yml` builds on every push/PR to `main`; on push to `main` it publishes `ghcr.io/egormak/tracker-web:<YYYY-MM-DD>` and `:latest`.
