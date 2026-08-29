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

docker compose up -d

# Application: http://localhost:8080
curl http://localhost:8080/api/health
```

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

## Local build

```bash
docker build -f Dockerfile.fullstack -t github-stars-manager-fullstack:local .
docker run -d -p 8080:3000 -v github-stars-data:/app/data \
  -e API_SECRET="your-secret" github-stars-manager-fullstack:local
```

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
- Pure frontend (no backend) does not show MCP settings.

## Stopping

```bash
docker compose down
# Do not use -v unless you intend to destroy all server data.
```
