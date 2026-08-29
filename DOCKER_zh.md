# Docker 部署指南

GithubStarsManager 推荐使用 **全栈单镜像** Docker 部署：一个 Node/Express 进程在同一来源下提供网页、`/api` 与 MCP 端点。

## 准备条件

- 已安装 Docker，建议使用 Compose v2（`docker compose`）
- 必须设置足够强度的 `API_SECRET`

## 快速开始（推荐）

```bash
# 在仓库根目录创建 .env
echo 'API_SECRET=替换为足够长的随机密钥' > .env
# 可选：固定镜像版本与加密密钥
# echo 'IMAGE_TAG=0.7.8' >> .env
# echo 'ENCRYPTION_KEY=你的加密密钥' >> .env

docker compose up -d --build

# 访问 http://localhost:8080
curl http://localhost:8080/api/health
```

> 从本地源码测试时建议加 `--build`，使镜像与当前代码一致；仅使用已发布的 GHCR 镜像时可省略 `--build`。

> **GHCR 私有镜像：** 拉取前先登录：
> ```bash
> docker login ghcr.io -u YOUR_GITHUB_USERNAME
> ```
> 密码使用具有 `read:packages` 权限的 [GitHub Personal Access Token](https://github.com/settings/tokens)。

### 镜像信息

| 项目 | 值 |
|------|-----|
| 镜像 | `ghcr.io/amintacccp/github-stars-manager-fullstack` |
| 容器端口 | `3000`（默认映射到宿主机 `8080`） |
| 数据卷 | `/app/data` |

**标签：** `latest`（main 最新构建）、`vX.Y.Z` / `X.Y.Z` / `X.Y` / `X`（正式发布，须与根目录 `package.json` 版本一致）、`sha-abc1234`（指定提交）。镜像提供 `linux/amd64` 与 `linux/arm64`。

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `API_SECRET` | **是**（生产 / Docker） | — | `/api` 的 Bearer 认证令牌；Compose 未设置时拒绝启动。 |
| `ENCRYPTION_KEY` | 建议设置 | 在 `data/.encryption-key` 中自动生成 | 加密存储密钥的 AES-256 密钥；生产环境建议显式设置，避免重建卷后密钥变化。 |
| `PORT` | 否 | `3000` | 容器内监听端口 |
| `DB_PATH` | 否 | `data/data.db` | SQLite 数据库路径 |
| `IMAGE_TAG` | 否 | `latest` | 全栈镜像标签（仅 Compose） |

## SQLite 与持久化

- **仅支持单实例** — SQLite 不支持多写入者并发。只运行一个容器副本；不要在负载均衡后水平扩展多个实例（除非改用外部数据库）。
- **必须挂载持久卷** — 映射 `/app/data`（Compose 中名为 `backend-data`），内含 `data.db` 与 `.encryption-key`。
- **备份两个文件** — 先停止容器（或确保无写入），再打包卷内容：
  ```bash
  docker compose down
  docker run --rm \
    -v githubstarsmanager_backend-data:/data:ro \
    -v "$PWD":/backup \
    alpine tar czf /backup/github-stars-manager-data-backup.tgz -C /data .
  docker compose up -d
  ```
  卷名以 `docker volume ls` 为准（通常为 `<项目名>_backend-data`）。

## HTTPS（外部反向代理）

容器内为明文 HTTP（3000 端口）。请在前面使用 Caddy、Traefik、nginx 等终止 TLS：

```text
Internet → HTTPS (443) → 反向代理 → http://app:3000
```

若使用 MCP SSE，请配置代理转发 `Host`、`X-Forwarded-Proto` 及 WebSocket 相关头。

## 升级

1. 备份数据卷（见上文）。
2. 在 `.env` 中设置目标 `IMAGE_TAG`（或使用 `latest`）。
3. 重建容器：
   ```bash
   docker compose pull
   docker compose up -d
   ```
4. 验证：`curl http://localhost:8080/api/health`

升级时保持 `API_SECRET` 与 `ENCRYPTION_KEY` 不变。

## 直接 `docker run`

`docker run` 不会读取 Compose 的 `.env`，需自行导出环境变量或使用 `-e`。

```bash
export IMAGE_TAG=0.7.8

docker run -d \
  --name github-stars-manager \
  -p 8080:3000 \
  -v github-stars-data:/app/data \
  -e API_SECRET="your-api-secret" \
  -e ENCRYPTION_KEY="your-encryption-key" \
  ghcr.io/amintacccp/github-stars-manager-fullstack:${IMAGE_TAG}
```

首次部署可不传 `ENCRYPTION_KEY`，服务会在卷内生成并保存；迁移前请备份 `.encryption-key`。

## 本地构建与冒烟测试（网页应用）

本项目为 **纯 Web**（已无 Electron / 桌面安装包）。本地构建与验证推荐使用全栈 Docker 镜像：一个容器同时提供 SPA、`/api` 与 MCP。

### 从源码构建并运行（Compose）

```bash
# 在仓库根目录
echo 'API_SECRET=替换为足够长的随机密钥' > .env

# 构建 Dockerfile.fullstack 并启动
docker compose up -d --build

# 健康检查
curl http://localhost:8080/api/health

# 浏览器打开
# http://localhost:8080
```

使用与 `.env` 相同的 `API_SECRET` 登录，再按提示连接 GitHub PAT。数据保存在 Compose 卷 `backend-data`（容器内 `/app/data` 的 SQLite）。

改代码后重新构建：

```bash
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f app
```

停止（保留数据）：

```bash
docker compose down
```

### 不使用 Compose 构建镜像

```bash
docker build -f Dockerfile.fullstack -t github-stars-manager-fullstack:local .
docker run -d --name github-stars-manager \
  -p 8080:3000 \
  -v github-stars-data:/app/data \
  -e API_SECRET="your-secret" \
  github-stars-manager-fullstack:local
```

### 冒烟检查清单

1. `GET /api/health` 返回正常。
2. 浏览器打开 `http://localhost:8080`，可用 `API_SECRET` 登录。
3. 连接 GitHub Token 后能从后端加载星标仓库（重新登录应从 SQLite 恢复数据）。
4. 可选：设置 → WebDAV / Embedding / MCP — 均走同源 `/api/proxy/*` 或 `/mcp`（不是桌面客户端）。

### 单元测试 / CI（宿主机 npm，不替代 Docker 冒烟）

```bash
npm ci
npm run check:boundaries && npm run lint && npm run typecheck && npm run test:run && npm run build
cd server && npm ci && npm test && npm run build
```

仅跑 Vite（`npm run dev` / `npm run dev:all`）适合改 UI；会话 Cookie、代理与持久化等接近生产的行为请用上面的 Docker 流程验证。

## 从旧版分离部署（前端 + 后端）迁移

若此前分别运行 nginx 前端与 Node 后端，并使用 `backend-data` 数据卷：

1. 停止旧栈，**不要**加 `-v`（`docker compose down`）。
2. 备份现有 `backend-data` 卷。
3. 将 `API_SECRET`（及已设置的 `ENCRYPTION_KEY`）写入 `.env`。
4. 在**同一项目目录**启动全栈 Compose，以复用数据卷：
   ```bash
   docker compose up -d
   ```
5. 在 `http://localhost:8080` 验证界面、API 与 MCP。

分离镜像（`github-stars-manager-frontend`、`github-stars-manager-backend` / `-server`）已不再发布，请仅使用全栈镜像。

## MCP 服务（Agent 访问）

全栈镜像下 MCP 与 UI 同源：

| 端点 | 默认地址 | 说明 |
|------|----------|------|
| Streamable HTTP | `http://localhost:8080/mcp` | 推荐 Claude Code、Cursor |
| Legacy SSE | `http://localhost:8080/mcp/sse` | GET 建立流；POST 至 `/mcp/sse/messages?sessionId=…` |
| Legacy SSE 别名 | `http://localhost:8080/sse` | 消息地址 `/messages?sessionId=…` |

1. 打开应用 → **设置 → MCP 服务**
2. 开启 MCP（Docker 模式下后端已内置）
3. 复制 MCP Token 与 Agent JSON 配置

- MCP Token 与 `API_SECRET` **相互独立**。
- 登录应用后才会显示 MCP 设置页。

## HTTPS 页面访问局域网 HTTP 服务

全栈容器对外可以是 HTTPS，但 **出站** WebDAV / Ollama / 局域网 AI 由容器内 Node 发起：

| 浏览器页面 | 目标服务 | 是否可用 |
|------------|----------|----------|
| `https://…` | `https://` WebDAV / Embedding API | 可以（经 `/api/proxy/*`） |
| `https://…` | `http://192.168.x.x` NAS 或 Ollama | **仅当 Docker 主机能访问该 IP** |
| 远程 VPS 上的 `https://…` | 家里 `http://192.168.x.x` | 不可以 — 需暴露服务，或把应用部署在同一局域网 |

浏览器不会直连这些 `http://` 地址（混合内容拦截）；应用一律走同源 `/api/proxy/webdav` 与 `/api/proxy/embedding`。

## 停止与清理

```bash
docker compose down
# 除非确认要销毁全部服务端数据，否则不要使用 -v。
```
