# Docker Deployment

GithubStarsManager is deployed as a **single full-stack Docker image**: one Node/Express process serves the SPA, `/api`, and MCP endpoints from the same origin.

## Prerequisites

- Docker with Compose v2 (`docker compose`)
- A strong random `API_SECRET` (required)

## Quick Start (recommended)

```bash
# Create .env in the project root (or export these variables)
echo 'API_SECRET=replace-with-a-long-random-secret' > .env
# Optional: pin image version and set a fixed encryption key
# echo 'IMAGE_TAG=0.7.8' >> .env
# echo 'ENCRYPTION_KEY=your-64-char-hex-or-passphrase' >> .env

docker compose up -d --build

# Application: http://localhost:8080
curl http://localhost:8080/api/health
```

> Prefer `docker compose up -d --build` when testing from a local checkout so the image matches your tree. Omit `--build` to pull/use the published GHCR image.

> **Private GHCR packages:** authenticate before pulling:
> ```bash
> docker login ghcr.io -u YOUR_GITHUB_USERNAME
> ```
> Use a [Personal Access Token](https://github.com/settings/tokens) with `read:packages` scope.

### Image

| Item | Value |
|------|--------|
| Image | `ghcr.io/amintacccp/github-stars-manager-fullstack` |
| Container port | `3000` (mapped to host `8080` by default) |
| Data volume | `/app/data` |

**Tags:** `latest` (main branch), `vX.Y.Z` / `X.Y.Z` / `X.Y` / `X` (releases — must match root `package.json` version), `sha-abc1234` (commit builds). Images are published for `linux/amd64` and `linux/arm64`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_SECRET` | **Yes** (production / Docker) | — | Bearer token for `/api` authentication. Compose refuses to start without it. |
| `ENCRYPTION_KEY` | Recommended | Auto-generated in `data/.encryption-key` | AES-256 key for encrypting stored secrets. Set explicitly in production so the key survives volume recreation. |
| `PORT` | No | `3000` | Server listen port inside the container |
| `DB_PATH` | No | `data/data.db` | SQLite database path |
| `IMAGE_TAG` | No | `latest` | Full-stack image tag (Compose only) |

## SQLite and persistence

- **Single instance only** — SQLite does not support multiple concurrent writers. Run one container replica; do not scale horizontally behind a load balancer without externalizing the database.
- **Persistent volume required** — mount `/app/data` (Compose service `backend-data`). It stores `data.db` and `.encryption-key`.
- **Backup both files** — stop the container (or ensure no writes), then archive the volume contents:
  ```bash
  docker compose down
  docker run --rm \
    -v githubstarsmanager_backend-data:/data:ro \
    -v "$PWD":/backup \
    alpine tar czf /backup/github-stars-manager-data-backup.tgz -C /data .
  docker compose up -d
  ```
  Replace the volume name with the output of `docker volume ls` (typically `<project>_backend-data`).

## HTTPS (external reverse proxy)

The container serves plain HTTP on port 3000. Terminate TLS in front with Caddy, Traefik, nginx, or another reverse proxy:

```text
Internet → HTTPS (443) → reverse proxy → http://app:3000
```

Configure the proxy to forward `Host`, `X-Forwarded-Proto`, and WebSocket headers if you use MCP SSE endpoints.

## Upgrade

1. Back up the data volume (see above).
2. Set `IMAGE_TAG` to the target release (or pull `latest`).
3. Recreate the container:
   ```bash
   docker compose pull
   docker compose up -d
   ```
4. Verify: `curl http://localhost:8080/api/health`

Keep the same `API_SECRET` and `ENCRYPTION_KEY` across upgrades.

## Direct `docker run`

Compose's `.env` is not loaded by `docker run`; export variables or pass `-e` explicitly.

```bash
export IMAGE_TAG=0.7.8

docker run -d \
  --name github-stars-manager \
  -p 8080:3000 \
  -v github-stars-data:/app/data \
  -e API_SECRET="your-secret-here" \
  -e ENCRYPTION_KEY="your-encryption-key" \
  ghcr.io/amintacccp/github-stars-manager-fullstack:${IMAGE_TAG}
```

Omit `ENCRYPTION_KEY` on first run to auto-generate one in the volume; back up `.encryption-key` before any migration.

## Local build and smoke test (web app)

This project is **web-only** (no Electron / desktop installer). The recommended way to build and verify locally is the full-stack Docker image: one container serves the SPA, `/api`, and MCP.

### Build and run from source (Compose)

```bash
# From the repository root
echo 'API_SECRET=replace-with-a-long-random-secret' > .env

# Build Dockerfile.fullstack and start the container
docker compose up -d --build

# Health check
curl http://localhost:8080/api/health

# Open the web UI
# http://localhost:8080
```

Log in with the same `API_SECRET`, then connect a GitHub PAT when prompted. Data is stored in the Compose volume `backend-data` (SQLite under `/app/data`).

Rebuild after code changes:

```bash
docker compose up -d --build
```

Follow logs:

```bash
docker compose logs -f app
```

Stop (keep data):

```bash
docker compose down
```

### Build image without Compose

```bash
docker build -f Dockerfile.fullstack -t github-stars-manager-fullstack:local .
docker run -d --name github-stars-manager \
  -p 8080:3000 \
  -v github-stars-data:/app/data \
  -e API_SECRET="your-secret" \
  github-stars-manager-fullstack:local
```

### Smoke checklist

1. `GET /api/health` returns OK.
2. Browser opens `http://localhost:8080` and accepts `API_SECRET` login.
3. After GitHub token connect, starred repos load from the backend (re-login should restore data from SQLite).
4. Optional: Settings → WebDAV / Embedding / MCP — these call same-origin `/api/proxy/*` or `/mcp` (not a desktop client).

### Unit / CI checks (npm, without Docker)

For PR verification on the host (not a substitute for the Docker smoke test above):

```bash
npm ci
npm run check:boundaries && npm run lint && npm run typecheck && npm run test:run && npm run build
cd server && npm ci && npm test && npm run build
```

Frontend-only Vite (`npm run dev` / `npm run dev:all`) is for UI iteration; production-like behaviour (session cookie, proxies, persistence) should be validated with Docker as above.

## Migrate from an older split (frontend + backend) deployment

If you previously ran separate nginx frontend and backend containers with a `backend-data` volume:

1. Stop the old stack **without** deleting the volume (`docker compose down`, no `-v`).
2. Back up the existing `backend-data` volume.
3. Put `API_SECRET` (and `ENCRYPTION_KEY` if set) in `.env`.
4. From the **same project directory**, start the full-stack compose so the volume is reused:
   ```bash
   docker compose up -d
   ```
5. Verify UI, API, and MCP at `http://localhost:8080`.

Split images (`github-stars-manager-frontend`, `github-stars-manager-backend` / `-server`) are no longer published; use the full-stack image only.

## MCP Server (Agent access)

With the full-stack image, MCP endpoints are on the same origin as the UI:

| Endpoint | URL (default) | Notes |
|----------|---------------|--------|
| Streamable HTTP | `http://localhost:8080/mcp` | Preferred for Claude Code / Cursor |
| Legacy SSE | `http://localhost:8080/mcp/sse` | GET opens stream; POST to `/mcp/sse/messages?sessionId=…` |
| Legacy SSE (alias) | `http://localhost:8080/sse` | Messages at `/messages?sessionId=…` |

1. Open the app → **Settings → MCP Server**.
2. Enable MCP (requires backend connection — automatic in Docker).
3. Copy the MCP token and agent JSON config.

```json
{
  "mcpServers": {
    "github-stars-manager": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer gsm_mcp_..."
      }
    }
  }
}
```

- MCP token is **separate** from `API_SECRET`.
- MCP settings appear after you sign in to the app.

## HTTPS UI with HTTP LAN services

The full-stack container terminates (or sits behind) HTTPS for the browser, but **outbound** WebDAV / Ollama / LAN AI calls are made by the Node process inside the container:

| Browser page | Target service | Works? |
|--------------|----------------|--------|
| `https://…` | `https://` WebDAV / embedding API | Yes (via `/api/proxy/*`) |
| `https://…` | `http://192.168.x.x` NAS or Ollama | Yes **only if the Docker host can reach that IP** |
| `https://…` on a remote VPS | Home-LAN `http://192.168.x.x` | No — expose the service or run the app on the LAN |

Browsers never call those `http://` URLs directly (mixed content); the app always uses same-origin `/api/proxy/webdav` and `/api/proxy/embedding`.

## Stopping

```bash
docker compose down
# Do not use -v unless you intend to destroy all server data.
```
