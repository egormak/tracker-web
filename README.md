Tracker Web UI
================

Modern web interface and Telegram Mini App for the Go `tracker-server` REST API, built with React 18, TypeScript, Vite, and Material UI (MUI v6).

Features
--------

- **Analytics Dashboard**: Real-time stats, weekly metrics breakdown (Overview, Daily Breakdown, Task Targets), 24h session timeline canvas, role donut chart, Evening Focus mode, Today task progress card with search & filters, and Linear Warm-Up Ramp progression.
- **Interactive Weekly Schedule**: Multi-day schedule editor, task prioritization, rollover & backlog tracking, and one-click active schedule application.
- **Real-Time Running Timer**: WebSocket-driven live concurrent task tracking (`/api/v1/timer/ws`), high-DPI circular canvas timer, zero-asset Web Audio synthesis feedback, keyboard shortcuts, sequence modes (percent, backlog, evening combo), and batch session runner.
- **Dual Runtime**: Runs as a desktop browser application and as an embedded Telegram Mini App (`window.Telegram.WebApp`) with native back-button integration, automatic viewport expansion, and init-data authentication.
- **Warm-Up Ladder 2.0 (Linear Ramp)**: Progressive focus cap management with settings configuration and cross-component event sync.
- **Rest Balance Management**: Track rest time in scaled units (`units = minutes * 100`) with support for adding, spending, and resetting balance.
- **Plan & Record Management**: Manage task rotation, configure plan percentage groups, and log completed work.

Prerequisites
-------------
- Node.js 18+
- npm 9+

Configuration
-------------
- API base URL is configurable via `VITE_API_BASE_URL` (defaults to same-origin `''`).
- During `npm run dev`, Vite proxies `/api` to `http://localhost:3000` to avoid CORS against a local `tracker-server`.
- In the Docker image, nginx proxies `/api` to `TRACKER_SERVER_URL` at container runtime.

Getting Started
---------------
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173).

Build and Verification
----------------------
```bash
# Type check and production build (required verification step)
npm run build

# Preview production build locally
npm run preview
```

Pages
-----
- **Dashboard** (`/`): Today's statistics, weekly analytics tabs, 24h timeline canvas, role breakdown donut chart, Evening Focus recommendations, Today task progress with filtering, and Linear Ramp badge.
- **Schedule** (`/schedule`): Weekly schedule editor by day, task priorities and percent groups, rollover & backlog tasks, and schedule activation.
- **Timer** (`/timer`): Active running tasks, circular canvas timer, WebSocket sync, audio cues, keyboard shortcuts, batch & combo sessions, and URL query parameter initialization (`?task=&role=&target=&combo=`).
- **Plan** (`/plan`): Next task by plan rotation, plan percent group rotation, and procents configuration.
- **Rest** (`/rest`): Rest balance tracking with add, spend, and reset actions.
- **Record** (`/record`): Manual recording of task duration, source day, and service distribution.
- **Manage** (`/manage`): Create tasks with role assignments (`work`, `learn`, `rest`, `plan`).

Docker Deployment
-----------------
Build the container image:
```bash
docker build -t ghcr.io/egormak/tracker-web:$(date +%F) .
```

Run on an existing Docker network connected to `tracker-server`:
```bash
docker run -d \
  --name tracker-web \
  --network tracker \
  -p 5173:80 \
  -e TRACKER_SERVER_URL=http://tracker:3000 \
  ghcr.io/egormak/tracker-web:$(date +%F)
```

Run against a tracker-server by IP address:
```bash
docker run -it --rm \
  -p 5173:80 \
  -e TRACKER_SERVER_URL=http://10.200.0.1:8080 \
  ghcr.io/egormak/tracker-web:$(date +%F)
```

The container serves the static build with nginx and proxies browser calls from `/api/...` to `TRACKER_SERVER_URL`.

CI/CD
-----
- `.github/workflows/docker-image.yml` builds on every push and pull request to `main`.
- On pushes to `main`, it publishes images to GitHub Container Registry tagged with `<YYYY-MM-DD>` and `latest`.
