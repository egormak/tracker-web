Tracker Web UI
================

Minimal React (Vite + TypeScript) UI for the Go tracker-server REST API.

Prerequisites
- Node.js 18+

Config
- API base URL is configurable via `VITE_API_BASE_URL` (defaults to same-origin '').
- During `npm run dev`, Vite proxies `/api` to `http://localhost:3000` to avoid CORS.
- In the Docker image, nginx proxies `/api` to `TRACKER_SERVER_URL` at container runtime.

Setup
1. cd web
2. npm install
3. npm run dev
   - Open http://localhost:5173

Build
- npm run build
- npm run preview

Pages
- Dashboard: today stats and rest balance
- Plan: show next task by plan, rotate legacy plan group, set procents (legacy manage endpoint)
- Rest: add/spend rest time
- Record: add a task record
- Manage: create a task with role (work/learn/rest/plan)
- Timer: get/set timer

Notes
- Endpoints are based on `openapi.yml` and `internal/api/routes/routes.go`.
- Some features use legacy endpoints (`/api/v1/manage/procents`, `/api/v1/task/plan-percent/change`).
- For local Vite builds that call an absolute API URL, set `VITE_API_BASE_URL` (e.g., `https://api.example.com`).

Docker (web only)
- Build: `docker build -t ghcr.io/egormak/tracker-web:$(date +%F) .`
- Run on the existing `tracker` Docker network and connect to the tracker-server container named `tracker`:
  `docker run -d --name tracker-web --network tracker -p 5173:80 -e TRACKER_SERVER_URL=http://tracker:3000 ghcr.io/egormak/tracker-web:$(date +%F)`
- Run against a tracker-server by IP address and port:
  `docker run -it --rm -p 5173:80 -e TRACKER_SERVER_URL=http://10.200.0.1:8080 ghcr.io/egormak/tracker-web:$(date +%F)`
- Open http://localhost:5173

The container serves the React app with nginx and proxies browser calls from `/api/...` to `TRACKER_SERVER_URL`. Use `http://tracker:3000` when both containers share the `tracker` Docker network and the backend container is named `tracker`. Use the exposed host IP and port, such as `http://10.200.0.1:8080`, when connecting through the host or another machine.

To replace an existing web container created with Docker's random name:

```bash
docker stop relaxed_mayer
docker rm relaxed_mayer
docker run -d \
  --name tracker-web \
  --network tracker \
  -p 5173:80 \
  -e TRACKER_SERVER_URL=http://tracker:3000 \
  ghcr.io/egormak/tracker-web:2026-05-25
```

Verify the deployment:

```bash
docker ps
docker logs tracker-web
curl http://localhost:5173
curl http://localhost:5173/api/v1/timer/get
```

GitHub Actions
- `.github/workflows/docker-image.yml` builds the Docker image for pushes and pull requests to `main`.
- On pushes to `main`, it publishes `ghcr.io/egormak/tracker-web:<YYYY-MM-DD>` and `ghcr.io/egormak/tracker-web:latest` to GitHub Container Registry.
