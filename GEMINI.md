# tracker-web

A modern web interface and Telegram Mini App for `tracker-server`, providing dashboards for statistics, weekly schedule editing, plan rotation management, rest tracking, and live running-task timers.

## Project Overview

- **Technology Stack**: React 18, TypeScript (strict), Vite, Material UI (MUI v6).
- **Dual Runtime**: Operates both as a standalone web browser app and embedded inside Telegram as a Telegram Mini App (`window.Telegram.WebApp`).
- **Architecture**:
  - `src/main.tsx`: Entrypoint wrapping `App` in `BrowserRouter` and MUI `ThemeProvider`.
  - `src/App.tsx`: App shell, navigation (desktop header + mobile bottom bar), and Telegram WebApp lifecycle (`ready()`, `expand()`, `BackButton`).
  - `src/api/client.ts`: Centralized API client. Contains all DTO interfaces (matching `openapi.yml`) and typed request wrappers (`api.stats`, `api.timer`, etc.). Automatically attaches `X-Telegram-Init-Data` header when running in Telegram.
  - `src/pages/`: Route components (`Dashboard.tsx`, `Schedule.tsx`, `Timer.tsx`, `Plan.tsx`, `Record.tsx`, `Rest.tsx`, `Manage.tsx`).
  - `src/components/`: Reusable presentational components (`Card`, `Header`, `Progress`, `PlanPercents`).
  - `src/theme.ts`: Custom MUI dark theme (indigo/cyan palette, pill buttons, glassmorphism cards).
  - `src/utils/format.ts`: Utilities including `formatRestMinutes` (`units / 100`).
- **Dev Proxy**: Vite dev server proxies `/api` requests to `http://localhost:3000`.

## Building and Running

### Development
```bash
npm install
npm run dev
```
Available at `http://localhost:5173`.

### Production Build & Type Verification
```bash
npm run build
```
Runs `tsc -b` (strict project-wide type check) and `vite build`. **Required verification step.**

### Preview Build
```bash
npm run preview
```

## Development Conventions

- **Centralized API**: All API calls belong in `src/api/client.ts`. Never inline raw `fetch()` calls in pages.
- **State Management**: Uses pure React hooks and local component state.
- **Live Timer Model**: `Timer.tsx` / `TaskTimerItem` polls `/api/v1/timer/run/list` / status every 5s while maintaining a 1s local tick for visual smoothing.
- **Rest-Time Conversion**: Always use `formatRestMinutes` to display rest time (`units = minutes * 100`).
- **Styling**: Use MUI `sx` props referencing theme tokens.
