# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vite + React 18 + TypeScript web UI and Telegram Mini App for the `tracker-server` REST API. Source code lives in `src/`:

- `src/pages/`: Route-level screens (`Dashboard.tsx`, `Schedule.tsx`, `Timer.tsx`, `Plan.tsx`, `Record.tsx`, `Rest.tsx`, `Manage.tsx`). Each page is self-contained with local state and `useEffect` fetches.
- `src/components/`: Shared UI components divided into:
  - Presentational components (`Card`, `Header`, `Alert`, `Progress`).
  - Feature widgets (`PlanPercents`, `EveningFocusCard`, `RampBadge`, `RampSettingsModal`, `TodayTaskProgressCard`) that interact with `api` directly.
- `src/components/canvas/`: High-DPI HTML5 Canvas 2D visualizations (`CircularTimerCanvas`, `Timeline24hCanvas`, `DonutChartCanvas`). Extend these instead of adding third-party chart libraries.
- `src/hooks/`: Custom React hooks:
  - `useTimerSync.ts`: WebSocket client for `/api/v1/timer/ws`, real-time task state updates, heartbeats, exponential reconnect, and server clock skew compensation.
  - `useHotkeys.ts`: Keyboard shortcut handling (Space for play/pause, 1/2/3 for task role selection).
- `src/constants/`: Central styling constants:
  - `themeColors.ts`: Design tokens (`DESIGN_TOKENS`), role themes (`ROLE_THEMES` for work/learn/rest/other), role colors (`ROLE_COLORS`), role tags (`ROLE_TAGS`), and timer presets (`TIMER_PRESETS`).
- `src/api/client.ts`: Centralized API client. Contains all DTO interfaces (matching `openapi.yml`), typed `api` endpoint methods, and `getTimerWebSocketUrl()`. Automatically attaches Telegram `initData` via headers/query params.
- `src/utils/`: Formatting and browser utility functions:
  - `format.ts`: `formatRestMinutes` (rest time units are scaled by 100).
  - `audio.ts`: `soundSynth` zero-asset Web Audio API synthesizer for tactile session sounds.
- `src/theme.ts` & `src/styles.css`: Dark MUI theme configuration and app-wide CSS custom properties.
- `src/main.tsx` & `src/App.tsx`: App mount, route definitions, dynamic ambient glow background, responsive desktop/mobile shells, and Telegram WebApp lifecycle.

## Build, Test, and Development Commands

- `npm install`: Install dependencies from `package-lock.json`.
- `npm run dev`: Start Vite dev server on `http://localhost:5173`; `/api` is proxied to `http://localhost:3000` via `vite.config.ts`.
- `npm run build`: Run TypeScript project checks (`tsc -b`), then build production assets with Vite. **This is the required verification step before submitting changes.**
- `npm run preview`: Serve the production build locally on port `5173`.

Set `VITE_API_BASE_URL` when the API is not same-origin, for example `VITE_API_BASE_URL=http://localhost:3000 npm run dev`.

## Architecture & Subsystem Conventions

- **Centralized API**: All network interaction belongs in `src/api/client.ts`. Never inline raw `fetch()` or `WebSocket` instances in pages or components.
- **Real-Time Timer Sync**: Live running-task state is managed via `useTimerSync.ts` over WebSocket (`/api/v1/timer/ws`). Do not poll `/api/v1/timer/run/list` in intervals. Visual smoothness is maintained via a 1s local tick in `TaskTimerItem`.
- **Session Chains & Storage**: Client-side multi-task chains (`tracker_evening_combo_session`, `tracker_batch_session`) persist to `localStorage`.
- **Rest-Time Representation**: API rest time is an integer scaled by 100 (`units = minutes * 100`). Always use `formatRestMinutes(raw)` for display.
- **Linear Warm-Up Ramp**: Warm-Up Ladder 2.0 (`/api/v1/ramp/*`) synchronizes across components using the custom event `ramp-updated` on `window`.
- **Telegram Mini App**: Code interacting with Telegram must guard on `window.Telegram?.WebApp` to ensure compatibility with standalone desktop browsers.

## Coding Style & Naming Conventions

- TypeScript with `strict` mode enabled.
- Two-space indentation, single quotes, no semicolons.
- React function components; PascalCase for component/page filenames (`Dashboard.tsx`, `RampBadge.tsx`).
- camelCase for functions, variables, and API methods.
- Styling: Use MUI `sx` props referencing theme tokens or `DESIGN_TOKENS` / `ROLE_THEMES`. Avoid introducing new CSS files.
- Keep API DTO interfaces in `src/api/client.ts` unless they warrant a dedicated module.

## Testing Guidelines

No automated test runner is currently configured. Treat `npm run build` (`tsc -b && vite build`) as the mandatory verification step. When adding tests, prefer Vitest with React Testing Library colocated as `*.test.tsx` or `*.test.ts`.

## Commit & Pull Request Guidelines

Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `perf:`), for example:
- `feat: implement WebSocket-based real-time timer synchronization`
- `fix: correct rest time formatting on balance reset`

Keep commit messages imperative and scoped to one logical change. Pull requests should summarize changes and confirm that `npm run build` succeeds.
