# tracker-web

A modern web interface and Telegram Mini App for `tracker-server`, providing analytics dashboards, weekly schedule editing, plan rotation management, rest tracking, linear warm-up ramp progression, and real-time running-task timers.

## Project Overview

- **Technology Stack**: React 18, TypeScript (strict), Vite, Material UI (MUI v6).
- **Dual Runtime**: Operates both as a standalone web browser application and embedded inside Telegram as a Telegram Mini App (`window.Telegram.WebApp`).
- **No Global Store**: Pure React hooks and local component state. API state is fetched per-page or per-widget in `useEffect`.

## Build, Test, and Development Commands

- `npm install`: Install dependencies from `package-lock.json`.
- `npm run dev`: Start Vite dev server on `http://localhost:5173`. `/api` is proxied to `http://localhost:3000` via `vite.config.ts` to avoid CORS against a local `tracker-server`.
- `npm run build`: Run `tsc -b` (strict project-wide type check) and `vite build`. **Required verification step before finishing any task.**
- `npm run preview`: Serve the production build locally on port 5173.

Set `VITE_API_BASE_URL` when the API is not same-origin, for example `VITE_API_BASE_URL=http://localhost:3000 npm run dev`. Default is same-origin (`''`), relying on the dev proxy or nginx reverse proxy.

## Architecture & Directory Structure

- `src/main.tsx`: Entrypoint wrapping `App` in `BrowserRouter`, MUI `ThemeProvider`, and `CssBaseline`.
- `src/App.tsx`: App shell, route definitions, responsive navigation (desktop top `Header` vs. mobile `BottomNavigation` + `Drawer`), route-based dynamic ambient glow backgrounds, and Telegram WebApp lifecycle (`ready()`, `expand()`, `BackButton`).
- `src/api/client.ts`: Centralized API client and single source of truth for backend interaction.
  - Contains all DTO interfaces aligned with `tracker-server`'s `openapi.yml`.
  - Typed request wrappers in `api` object grouped by domain (stats, records, plan-percent, rest, manage, timer, schedule, running-timer, evening-focus, ramp).
  - All HTTP requests go through `request<T>()`, which attaches `X-Telegram-Init-Data` header from `window.Telegram.WebApp.initData` when running in Telegram.
  - Exports `getTimerWebSocketUrl()` for WebSocket connections, appending `initData` as query parameter.
- `src/pages/`: Self-contained route components:
  - `Dashboard.tsx`: Weekly analytics with tabbed insights (Overview, Daily Breakdown, Task Targets), 24h timeline canvas, role donut chart, Evening Focus card, Today task progress card with search & filtering, and Linear Ramp badge.
  - `Schedule.tsx`: Weekly schedule editor with day tabs, task planning with priorities and percent groups, rollover & backlog task viewer, and schedule activation.
  - `Timer.tsx`: Live running tasks, circular canvas timer, WebSocket sync, audio cues, keyboard shortcuts, sequence modes (percent, backlog, evening combo), batch session runner, duration adjusters (+/- minutes), task selection autocomplete, and URL query parameter initialization (`?task=&role=&target=&combo=`).
  - `Plan.tsx`: Next task by plan rotation, plan percent group rotation, and legacy percent configurations (`/api/v1/manage/procents`).
  - `Record.tsx`: Direct manual logging of completed task duration, source day, and service distribution.
  - `Rest.tsx`: Rest balance tracking with add, spend, and reset (`/api/v1/rest/reset`) actions.
  - `Manage.tsx`: Task creation with role assignment (`work`, `learn`, `rest`, `plan`).
- `src/components/`:
  - **Presentational**: `Card`, `Header`, `Alert`, `Progress`. Keep free of domain business logic.
  - **Feature Widgets**: Self-fetching components dropped into pages (`PlanPercents`, `EveningFocusCard`, `RampBadge`, `RampSettingsModal`, `TodayTaskProgressCard`).
- `src/components/canvas/`: Hand-drawn high-DPI HTML5 Canvas 2D visualizations scaling for `devicePixelRatio`:
  - `CircularTimerCanvas.tsx`: Radial countdown/countup timer ring with 60 tick marks, role color glow, and smooth animations.
  - `Timeline24hCanvas.tsx`: 24-hour horizontal session timeline bar with role color segments.
  - `DonutChartCanvas.tsx`: Multi-segment donut chart displaying role breakdown percentages.
- `src/hooks/`:
  - `useTimerSync.ts`: Real-time WebSocket hook connecting to `/api/v1/timer/ws`. Handles event-driven updates (`STATE_SYNC`, `TASK_STARTED`, `TASK_PAUSED`, `TASK_RESUMED`, `TASK_STOPPED`, `TASK_ADJUSTED`, `HEARTBEAT_ACK`), exponential backoff reconnection, 25s heartbeats (with HTTP fallback), tab visibility re-sync, server clock skew calculation (`serverTimeOffset`), and server auto-stop callbacks.
  - `useHotkeys.ts`: Global keyboard shortcuts (`Space` to toggle play/pause, `1`/`2`/`3` to switch role to work/learn/rest) ignoring input/textarea elements.
- `src/constants/themeColors.ts`: Role themes (`ROLE_THEMES` for work/learn/rest/other with primary, light, glow, bg, badgeBg colors and Russian labels), `ROLE_COLORS`, `ROLE_TAGS`, `DESIGN_TOKENS` (bgMain, bgCard, bgInput, borderColor, etc.), and `TIMER_PRESETS` ([15, 20, 25, 45, 60]).
- `src/utils/`:
  - `format.ts`: `formatRestMinutes` formatting rest minutes from raw units (`units / 100`).
  - `audio.ts`: `soundSynth` zero-asset Web Audio API synthesizer for tactile sound feedback (session start triangle wave ramp, pause sine wave slide, completion bell chord) stored in `localStorage` (`timeflow_sound_enabled`).
- `src/theme.ts`: MUI dark theme configuring palette, glassmorphism cards/appbar, rounded typography, and custom component styles.
- `src/styles.css`: App-wide CSS variables, dark utility classes, custom scrollbar styling, and canvas wrapper styling.

## Key Subsystems & Behavioral Patterns

### Real-Time Running-Timer Model
- Task state does **not** poll every 5s; it syncs via WebSocket through `src/hooks/useTimerSync.ts`.
- In `Timer.tsx`, each `TaskTimerItem` ticks elapsed seconds locally every 1s using `accumulated * 60 + (now + serverTimeOffset - start_time)`. When reaching `target_duration`, the client triggers `onStop`.
- Client-side multi-task sessions on top of the server timer:
  - **Evening Focus Combo Chain**: `tracker_evening_combo_session` stored in `localStorage` (expires after 4 hours).
  - **Batch Session**: `tracker_batch_session` stored in `localStorage`.
- Deep linking / URL params: `Timer.tsx` reads `?task=...&role=...&target=...&combo=...` to automatically configure and launch timer sessions from other views.

### Linear Warm-Up Ramp (Warm-Up Ladder 2.0)
- Configured via `/api/v1/ramp/config` and `/api/v1/ramp/status`.
- Manages daily cap progression (`cap_minutes`, `current_step`), resetting, advancing, and task role filtering.
- Component sync: `RampBadge` and `RampSettingsModal` notify other components using `window.dispatchEvent(new CustomEvent('ramp-updated', { detail }))`.

### Rest-Time Representation
- Rest balance returned by the API is an integer scaled by 100 (`units = minutes * 100`).
- Always format rest time using `formatRestMinutes(raw)`.
- Rest page supports adding, spending, and resetting balance (`api.restReset()`).

### Telegram Mini App Integration
- Telegram WebApp types are globally declared in `src/vite-env.d.ts`.
- Always guard Telegram calls with `window.Telegram?.WebApp` for standalone browser compatibility.
- Telegram `BackButton` is wired in `App.tsx` to `navigate(-1)` whenever the route is not `/`.
- Auth data (`window.Telegram.WebApp.initData`) is sent via `X-Telegram-Init-Data` header on HTTP requests and query parameter on WebSockets.

## Development Conventions

- **Centralized API**: All network calls belong in `src/api/client.ts`. Never inline raw `fetch()` or `WebSocket` instances in pages.
- **Styling**: Use MUI `sx` props referencing theme tokens or `DESIGN_TOKENS` / `ROLE_THEMES`. Avoid adding new CSS files.
- **Charts and Visualizations**: Hand-drawn `<canvas>` components in `src/components/canvas/`. Do not introduce heavyweight chart libraries.
- **TypeScript & Linting**: Strict mode. Follow existing code style: 2-space indentation, single quotes, no semicolons.
- **Verification**: Run `npm run build` after changes to verify type safety and Vite asset compilation.
- **Commits**: Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, etc.).
