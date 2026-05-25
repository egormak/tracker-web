# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vite + React + TypeScript web UI for the tracker REST API. Source code lives in `src/`. Route-level screens are in `src/pages/`, shared UI is in `src/components/`, API wrappers and response types are in `src/api/client.ts`, formatting helpers are in `src/utils/`, and app-wide styles/theme live in `src/styles.css` and `src/theme.ts`. `src/main.tsx` mounts the app and `src/App.tsx` defines routes. Static public assets are not currently used; add them under `public/` if needed.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite dev server on `http://localhost:5173`; `/api` is proxied to `http://localhost:3000`.
- `npm run build`: run TypeScript project checks with `tsc -b`, then build production assets with Vite.
- `npm run preview`: serve the production build locally on port `5173`.

Set `VITE_API_BASE_URL` when the API is not same-origin, for example `VITE_API_BASE_URL=http://localhost:3000 npm run dev`.

## Coding Style & Naming Conventions

Use TypeScript with `strict` mode enabled. Follow the existing style: two-space indentation, single quotes, no semicolons, React function components, and MUI `sx` props for component-local styling. Name React components and page files in PascalCase (`Dashboard.tsx`, `PlanPercents.tsx`). Use camelCase for functions, variables, and API wrapper methods. Keep API DTO interfaces in `src/api/client.ts` unless they become shared across multiple modules.

## Testing Guidelines

No test runner is configured yet. For now, treat `npm run build` as the required verification step before submitting changes. When adding tests, prefer Vitest with React Testing Library, place tests next to the code as `*.test.tsx` or `*.test.ts`, and cover API error handling plus page-level user flows.

## Commit & Pull Request Guidelines

The current history uses Conventional Commits, for example `feat: add weekly schedule and timer pages with task management functionality`. Keep messages imperative and scoped to one change. Pull requests should include a short summary, verification steps such as `npm run build`, linked issues when applicable, and screenshots or screen recordings for visible UI changes.

## Security & Configuration Tips

Do not commit secrets or environment-specific API URLs. Prefer `VITE_API_BASE_URL` for runtime configuration and keep dev proxy assumptions in `vite.config.ts` aligned with the local tracker-server port.
