# tracker-web

A modern web interface for the tracker system, providing a dashboard for statistics, task management, and timer control.

## Project Overview

- **Technology Stack**: React 18, TypeScript, Vite, Material UI (MUI) v6.
- **Architecture**:
  - `src/api/`: API client definitions for interacting with the `tracker-server`.
  - `src/components/`: Reusable UI components.
  - `src/pages/`: Main application pages (Dashboard, Plan, Record, Rest, Manage, Timer).
  - `src/utils/`: Helper functions and utilities.
  - `src/theme.ts`: MUI theme configuration.
- **Proxying**: The Vite dev server is configured to proxy `/api` requests to `http://localhost:3000` to avoid CORS issues during development.

## Building and Running

### Prerequisites
- Node.js 18+
- npm or yarn

### Development
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

### Production Build
```bash
npm run build
```
The output will be in the `dist/` directory.

### Preview Build
```bash
npm run preview
```

## Development Conventions

- **State Management**: Uses React hooks and standard component state.
- **Styling**: Primarily uses Material UI components and theme. Custom styles are in `src/styles.css`.
- **API Interaction**: All API calls should be centralized in `src/api/` and use the base URL proxying.
- **Type Safety**: Use TypeScript for all components and logic. Ensure API response interfaces are well-defined.

## Key Features
- **Dashboard**: Overview of today's progress and task status.
- **Planning**: Manage task plan percentages and schedules.
- **Recording**: Record time spent on tasks manually.
- **Timer**: Active timer control for running tasks.
- **Rest Management**: Track and manage rest minutes.
