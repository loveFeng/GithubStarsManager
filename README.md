<div align="center">

![Logo](upload/logo.png)

# GithubStarsManager

![100% 本地数据](https://img.shields.io/badge/数据存储-100%25本地-success?style=flat&logo=database&logoColor=white) ![AI 支持](https://img.shields.io/badge/AI-支持多模型-blue?style=flat&logo=openai&logoColor=white) ![Web](https://img.shields.io/badge/部署-Web%20%7C%20Docker-informational?style=flat&logo=docker&logoColor=white) [![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/AmintaCCCP/GithubStarsManager) <a href="https://linux.do" alt="LINUX DO"><img src="https://img.shields.io/badge/LINUX-DO-FFB003.svg?logo=data:image/svg%2bxml;base64,DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiPjxwYXRoIGQ9Ik00Ni44Mi0uMDU1aDYuMjVxMjMuOTY5IDIuMDYyIDM4IDIxLjQyNmM1LjI1OCA3LjY3NiA4LjIxNSAxNi4xNTYgOC44NzUgMjUuNDV2Ni4yNXEtMi4wNjQgMjMuOTY4LTIxLjQzIDM4LTExLjUxMiA3Ljg4NS0yNS40NDUgOC44NzRoLTYuMjVxLTIzLjk3LTIuMDY0LTM4LjAwNC0yMS40M1EuOTcxIDY3LjA1Ni0uMDU0IDUzLjE4di02LjQ3M0MxLjM2MiAzMC43ODEgOC41MDMgMTguMTQ4IDIxLjM3IDguODE3IDI5LjA0NyAzLjU2MiAzNy41MjcuNjA0IDQ2LjgyMS0uMDU2IiBzdHlsZT0ic3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDojZWNlY2VjO2ZpbGwtb3BhY2l0eToxIi8+PHBhdGggZD0iTTQ3LjI2NiAyLjk1N3EyMi41My0uNjUgMzcuNzc3IDE1LjczOGE0OS43IDQ5LjcgMCAwIDEgNi44NjcgMTAuMTU3cS00MS45NjQuMjIyLTgzLjkzIDAgOS43NS0xOC42MTYgMzAuMDI0LTI0LjM4N2E2MSA2MSAwIDAgMSA5LjI2Mi0xLjUwOCIgc3R5bGU9InN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6IzE5MTkxOTtmaWxsLW9wYWNpdHk6MSIvPjxwYXRoIGQ9Ik03Ljk4IDcwLjkyNmMyNy45NzctLjAzNSA1NS45NTQgMCA4My45My4xMTNRODMuNDI2IDg3LjQ3MyA2Ni4xMyA5NC4wODZxLTE4LjgxIDYuNTQ0LTM2LjgzMi0xLjg5OC0xNC4yMDMtNy4wOS0yMS4zMTctMjEuMjYyIiBzdHlsZT0ic3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDojZjlhZjAwO2ZpbGwtb3BhY2l0eToxIi8+PC9zdmc+" /></a>



An app for managing github starred repositories.

<a href="https://www.producthunt.com/products/githubstarsmanager?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-githubstarsmanager" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1001489&theme=light&t=1754373322417" alt="GithubStarsManager - AI&#0032;organizes&#0032;GitHub&#0032;stars&#0032;for&#0032;easy&#0032;find | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a> <a href="https://trendshift.io/repositories/28489?utm_source=trendshift-badge&amp;utm_medium=badge&amp;utm_campaign=badge-trendshift-28489" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/trendshift/repositories/28489/daily?language=TypeScript" alt="AmintaCCCP%2FGithubStarsManager | Trendshift" width="250" height="55"/></a>

</div>

**[中文文档](README_zh.md)** | English  


## ✨ Features

> Tired of starring everything and finding nothing?

GitHub Stars Manager automatically syncs your starred repos, uses AI to summarize and categorize them, and lets you find anything with semantic search. Track releases, filter assets, and one‑click download—smarter than manual tags, simpler than GitHub.

### Core Features

| Feature | Description |
|---------|-------------|
| **Auto-sync Stars** | Connect your GitHub token to automatically pull all starred repositories |
| **GitHub Lists Sync** | Bidirectional sync with native GitHub Lists: pull Lists into tags/categories with auto-lock, push local categories back as GitHub Lists |
| **AI Summaries & Categories** | Generate tags, topics, and short README overviews using AI |
| **Semantic Search** | Find repos by intent, not exact names |
| **Vector Semantic Search** | Embed repo descriptions/READMEs into a Cloudflare Vectorize index; query with natural language for high-precision semantic matching |
| **MCP Server** | Optional Streamable HTTP / SSE endpoint so agents (Claude Code, Cursor, etc.) can search AI-enriched stars; requires backend (Docker or self-hosted server); toggle in Settings, no extra install |
| **Repository Q&A Assistant (Early Access)** | Ask simple, focused questions about one repository with commit-pinned, read-only evidence, traceable sources, and local session history. It does not index every repository file, so use a mature local coding agent for complex code analysis. |
| **Repository Release Downloads** | Open a repository's current releases from its card; browse paginated assets, release notes, source archives, and optional AI summaries, then download in the browser or through a configured RPC downloader. |
| **Release Tracking** | Subscribe to repos and see new versions in one unified timeline |
| **One‑click Downloads** | Expand release assets and download instantly |
| **Smart Asset Filters** | Match assets by keywords (dmg / mac / arm64 / aarch64) |
| **Fork Management** | View, sync upstream, and trigger GitHub Actions workflows on forked repos |
| **Gist Management** | Browse, create, edit, and delete Gists; AI-powered summaries and semantic search |
| **12 Theme Presets** | Switch instantly between 12 built-in palettes, each with coordinated light and dark variants, from Settings with live previews. |
| **Network Proxy** | HTTP / SOCKS5 proxy with protocol-level connection testing |
| **Remote Download (aria2)** | Send release assets to aria2 for download via JSON-RPC |
| **Diagnostic Logs** | Unified frontend/backend log viewer with debug capture mode |
| **Bilingual Wiki Jump** | Deepwiki (EN) or zread (ZH) based on repository language |
| **Web & Docker** | Pure web app — deploy one full-stack container (SPA + `/api` + MCP); no desktop client |

### Backend (required)

The web app needs Express + SQLite (included in the Docker full-stack image):

- **Cross-device Sync** — SQLite is the source of truth across browsers and devices
- **CORS-free API Proxying** — GitHub, AI, WebDAV, Embedding, and aria2 route through `/api`
- **Encrypted Token Storage** — API keys stay on the server; the browser uses an HttpOnly session cookie
- **Network Proxy Forwarding** — Route outbound requests through HTTP/SOCKS5 when configured
- **RPC Download Proxy** — Forward aria2 downloads through the server with encrypted secret storage

---

## 🔍 Interface Preview

### 1. Repository Management (`Stars` View)

**Features:**
- **AI Batch Analysis** — Select multiple repos and use AI to auto-generate descriptions, tags, and categories; supports pause/resume
- **Repo Card Display** — Shows stars, forks, language, default branch status; supports expanding README preview
- **Category Sidebar** — Drag to reorder categories, custom category colors, collapse/expand sidebar; supports locking categories to prevent AI overrides
- **Bulk Action Toolbar** — Bulk categorize to a specified category, bulk restore AI analysis results
- **Multi-layout Support** — Adapts layout for desktop and tablet
- **Subscription Indicators** — Shows which repos have Release update subscriptions
- **AI Analysis Status** — Shows analyzed / not analyzed / analysis failed; filter by analysis status

**Screenshot:**
![Repository Management Interface](upload/repo.png)

---

### 2. Repository Q&A Assistant (Early Access)

Ask concise questions about a single repository directly from its card. Each conversation is tied to a specific commit and shows the evidence used to produce the answer.

**Features:**
- **Commit-pinned, read-only evidence** — Sources remain tied to the repository revision selected when the conversation starts.
- **Traceable answers** — Inspect source links and the assistant's retrieval activity alongside each response.
- **Local session history** — Revisit, search, and manage conversations independently for each repository.
- **Configurable retrieval budgets** — Control limits for turns, tool calls, document/code reads, and response duration in AI settings.

> **Early-access notice:** This feature is designed for simple repository questions and may fail, return incomplete evidence, or be unable to answer. It does not index every file in the queried repository. For complex, whole-codebase analysis, multi-file reasoning, debugging, or code changes, clone the repository locally and use a mature coding agent.

**Screenshot:**
![Repository Q&A Assistant](upload/copilot.png)

---

### 3. Release Timeline (`Releases` View)

**Features:**
- **Release Subscription Management** — Subscribe/unsubscribe to repo releases; supports bulk unsubscribe
- **Timeline Display** — Lists all new releases in reverse chronological order; shows read/unread status
- **Smart Asset Filtering** — Filter by platform (macOS / Windows / Linux / ARM); filter by file type (dmg / zip / deb / rpm / apk)
- **Custom Filter Rules** — Save custom keyword filter rules
- **Expand & Download** — Expand release assets list, one-click copy download links; shows file size
- **Release Details** — Displays version number, release name, time since release
- **Multi-view Modes** — List view / Grid view toggle
- **Paginated Loading** — Load historical release records page by page
- **Refresh Status Indicator** — Shows last refresh time

**Screenshot:**
![Release Timeline Interface](upload/release.png)

---

### 4. Discovery / Trending (`Discover` View)

**Features:**
- **Five Discovery Channels** — Trending / Hot Release / Most Popular / Topic / Search
- **Trending Time Range** — Three time dimensions: Today / This Week / This Month
- **Trending Filtering Rules** — Updated within 30 days, 50+ stars, sorted by stars descending
- **Platform Filtering** — Filter by OS (All / macOS / Windows / Linux / Browser)
- **Programming Language Filtering** — Filter by language (JavaScript / TypeScript / Python / Go / Rust, etc.)
- **AI Repo Analysis** — One-click AI analysis for trending repos
- **Subscribe to Trending Repos** — Add interesting trending repos to subscription list
- **Mobile Tab Navigation** — Channel switching adapted for mobile devices

**About Trending:**
> Trending data is sourced from GitHub's trending RSS feed, auto-updated every 30 minutes. Perfect for discovering emerging hot projects, tracking tech trends, and finding learning directions.

**Screenshot:**
![Discovery Trending Interface](upload/discovery.png)

---

### 5. Fork Management (`Forks` View)

**Features:**
- **Fork Listing** — Automatically fetches all your forked repos with upstream update detection
- **One-click Sync** — Merge upstream changes into any branch with conflict handling
- **GitHub Actions** — View and trigger workflow runs directly from fork cards
- **Read/Unread Tracking** — Pulse indicator for forks with new upstream commits
- **Search & Pagination** — Full-text search, configurable page sizes

**Screenshot:**
![Fork](upload/fork.png)

---

### 6. Gist Management (`Gist` View)

**Features:**
- **Gist Listing** — Automatically syncs all your Gists and starred Gists with category filtering (All / Mine / Starred)
- **Create & Edit** — Multi-file Gist editor with syntax-highlighted code blocks; supports adding, renaming, and deleting files
- **AI Analysis** — One-click AI summarization for Gist content; batch analysis with pause/resume
- **Semantic Search** — AI-powered search reranking to find Gists by intent, not just filename
- **Detail View** — Expandable Gist detail modal with file content, syntax highlighting, and copy-to-clipboard
- **Star & Unstar** — Star/unstar Gists directly from the card
- **Smart Filtering** — Filter by analysis status, language, and sort by name/date/file count

**Screenshot:**
![Gist Management Interface](upload/gist.png)

---

### 7. Search & Filters

**Features:**
- **Multi-dimensional Search** — Keyword search, repo status filter, tag filter, language filter, platform filter
- **AI Analysis Status Filter** — Analyzed / Not Analyzed / Analysis Failed / Edited
- **Release Subscription Filter** — Subscribed / Not Subscribed to Release
- **Category Status Filter** — Category Locked / Not Locked
- **Shortcut Keys Support** — Displays search shortcut hints
- **Search Statistics** — Shows result count and filter conditions
- **Search Demo Mode** — Demonstrates semantic search capabilities

**Screenshot:**
![Search Interface](upload/search.png)

---

### 8. Settings Panel

**Settings Groups:**

| Group | Features |
|-------|----------|
| **General** | Language toggle (ZH/EN), light/dark mode, and live-preview switching among 12 built-in theme presets |
| **AI Config** | Configure OpenAI / Anthropic / Ollama / compatible APIs; supports custom endpoints and keys |
| **WebDAV** | Backup config for Jianguoyun, Nextcloud, ownCloud, and standard WebDAV services |
| **Backup** | Backup history, manual backup/restore, incremental backup |
| **Backend / Session** | Sign in with `API_SECRET`, GitHub PAT on the server, sync status indicator |
| **Network** | HTTP/SOCKS5 proxy config with protocol-level testing; aria2 RPC remote download setup |
| **Category** | Category management, category sorting, default category override rules |
| **Data Management** | Data import/export, clear local data, reset all data |
| **Vector Search** | Configure Cloudflare Vectorize worker, embedding model, index mode (description / README), and manage index rebuild |
| **MCP Server** | Enable MCP so agents (Claude Code, Cursor, etc.) can search your AI-enriched stars via Streamable HTTP / SSE with Bearer-token auth |

**Screenshot:**
![Settings Panel Interface](upload/settings.png)

**Appearance:** Select any of the 12 built-in theme presets in **Settings → General → Appearance**. Every preset includes coordinated light and dark palettes and applies immediately across the application.

---

### 9. Custom AI Models

**Features:**
- **Multi AI Provider Support** — OpenAI (GPT-3.5/GPT-4), Anthropic (Claude), Ollama (local models), any OpenAI-compatible API
- **Custom Endpoints** — Supports privately deployed AI services
- **Connection Testing** — Test API connection after configuration
- **AI Model Selection** — Choose the specific model to use

**Screenshot:**
![AI Configuration Interface](upload/ai.png)

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React + Font Awesome
- **Build Tool**: Vite

## 👋🏻 How to Use

GithubStarsManager is a **web application** (browser + Docker). There is no desktop / Electron client.

### 🐳 Docker (recommended — run and test locally)

Single full-stack image: SPA, API, and MCP on one origin.

```bash
echo 'API_SECRET=replace-with-a-long-random-secret' > .env
docker compose up -d --build
# Open http://localhost:8080 — sign in with API_SECRET, then connect a GitHub PAT
curl http://localhost:8080/api/health
```

Full guide (local rebuild, smoke checklist, HTTPS, backup, LAN HTTP services): [DOCKER.md](DOCKER.md).

### 🛠 Frontend iteration (Vite, optional)

For UI work without rebuilding the image each time:

```bash
npm install
npm run dev:all    # Vite + Express (or: npm run dev && npm run dev:server)
```

Open the Vite URL shown in the terminal. Use Docker above to validate production-like session auth, proxies, and SQLite persistence.

### 🖥️ Backend (required for the web app)

Production and Docker use Express + SQLite as the sole data store and outbound proxy (bundled in the full-stack image):

- **Cross-device sync** — SQLite is the source of truth
- **CORS-free proxying** — GitHub / AI / WebDAV / Embedding / aria2 via `/api`
- **Session auth** — HttpOnly cookie after `API_SECRET` login; secrets stay on the server

#### Manual backend only

```bash
cd server
npm install
# set API_SECRET in the environment for production-like auth
npm run dev
```

#### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `API_SECRET` | Yes (Docker / production) | Login secret for `/api` session auth |
| `ENCRYPTION_KEY` | Recommended | AES-256 key for stored secrets; auto-generated in the data volume if unset |
| `PORT` | No | Server port (default `3000`) |

#### Sign-in (Docker / full-stack)

1. Open `http://localhost:8080`
2. Enter `API_SECRET` to create a session
3. Enter a GitHub PAT when prompted (stored encrypted on the server)
4. Data loads from SQLite after login (including re-login)

## 🤖 AI Service Configuration

The app supports multiple AI providers. Configure yours in the Settings panel:

- **OpenAI**: GPT-3.5 / GPT-4
- **Anthropic**: Claude
- **Ollama**: local models with no API key needed
- **Any OpenAI-compatible API**: custom endpoint + key

Steps: open Settings, add an AI config, enter your endpoint and key, pick a model, then test the connection.

## 🌐 Network Proxy Configuration

The app supports routing all outbound requests through a proxy:

- **HTTP Proxy** — Standard HTTP CONNECT tunneling with optional authentication
- **SOCKS5 Proxy** — Full SOCKS5 support including username/password auth (RFC 1929)
- **Protocol-level Testing** — Connection test performs actual protocol handshakes, not just TCP connect
- **Encrypted Storage** — Proxy passwords are encrypted at rest with AES-256-GCM

Configure in Settings → Network tab (after signing in to the backend).

![network](upload/network.png)

## ⬇️ Remote Download (aria2 RPC)

Send release download links directly to an aria2 daemon:

1. Start aria2 with RPC enabled: `aria2c --enable-rpc --rpc-listen-port=6800`
2. Open Settings → Network → Remote Download
3. Enter host, port, and optional secret
4. Test connection, then save
5. Release asset buttons will now queue downloads to aria2

Works when the backend is connected (Docker full-stack or local server); downloads are proxied through the server when configured.

## 🧠 Vector Semantic Search (Optional)

Vector Semantic Search uses [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/) to provide high-precision, natural-language search over your starred repositories. Instead of keyword matching, it embeds repo descriptions (or full README content) into vectors and searches by semantic similarity.

![vectorize](upload/vectorize.png)

**How it works:**
1. The app generates embeddings via your configured provider (OpenAI, Gemini, Cohere, Ollama, SiliconFlow, or any OpenAI-compatible API). With the backend connected (Docker full-stack or `npm run dev:server`), calls go through `/api/proxy/embedding` so the browser avoids vendor CORS and can use `http://` Ollama from an `https://` UI.
2. A lightweight Cloudflare Worker acts as a pure Vectorize proxy (store / query / delete)
3. On search, the query is embedded and matched against the vector index; results are optionally reranked by your AI service
4. When disabled or on failure, the app automatically falls back to keyword-based AI search

**Supported Embedding Providers:**

| Provider | Models | Dimensions |
|----------|--------|------------|
| OpenAI | text-embedding-3-small / large | 1536 / 3072 |
| Gemini | text-embedding-004 | 768 |
| Cohere | embed-multilingual-v3.0 | 1024 |
| Ollama | nomic-embed-text / bge-m3 | 768 / 1024 |
| SiliconFlow | BAAI/bge-large-zh-v1.5 | 1024 |
| OpenAI-compatible | (custom) | (custom) |

**Quick setup:**
1. Deploy the Cloudflare Worker — see [cloudflare-worker/README.md](cloudflare-worker/README.md) for step-by-step deployment instructions
2. In the app: **Settings → Vector Search** — enter the Worker URL and auth token
3. Configure an embedding provider (API key + model)
4. Click **Rebuild Index** to embed and upload all repos
5. Use the **AI Search** button — it will automatically use vector search when enabled

> ⚠️ After changing the embedding model, you must rebuild the index — different models produce incompatible vector dimensions.

## 🛰️ MCP Server (Agent access)

Let agents (Claude Code, Cursor, etc.) read your AI-enriched starred repositories — summaries, tags, categories — and search them via the [Model Context Protocol](https://modelcontextprotocol.io/).

- **Streamable HTTP** (preferred): `POST /mcp` on the app origin (backend/Docker mode)
- **Legacy SSE**: `/mcp/sse` + `/mcp/sse/messages` (backend/Docker)
- **Bearer-token auth** with a stable token (`gsm_mcp_...`): generated once when enabled, kept across restarts, only changes when you reset it

**Enable:** Settings → MCP Server → toggle on. The panel shows the endpoint URLs, the token, and a one-click copyable agent config (JSON) for both Streamable HTTP and SSE. No extra install needed.

> 💡 The MCP token is **separate** from the backend `API_SECRET`. MCP settings appear after you sign in (Docker / full-stack).

**Exposed tools (read-only):**

| Tool | Description |
|------|-------------|
| `gsm_status` | Server status: repo count, vector availability, version |
| `gsm_search_repos` | Keyword search over stars with filters (languages / tags / platforms / licenses / category / stars) and pagination |
| `gsm_get_repo` | Fetch one repo by numeric id or `owner/repo`, with AI-processed fields |
| `gsm_list_categories` | List custom categories |
| `gsm_list_repos_by_category` | List repos in a category with pagination |
| `gsm_stats` | Aggregate stats (languages, analysis, tags) |
| `gsm_vector_search` | Semantic vector search — listed only when Vector Search is configured and enabled |

![MCP](upload/mcp.png)

## 🔄 GitHub Lists Bidirectional Sync

Native [GitHub Lists](https://github.com/features/lists) (starred lists) sync both ways, in addition to the classic REST star sync:

- **Pull (GitHub → app)** — choose **Starred repos & lists** in **Settings → Star Sync** (or on first login). Lists are fetched via GraphQL; each list name is applied as a custom tag, and unlocked repos are categorized to the matching category and **auto-locked** so AI analysis won't reset them.
- **Push (app → GitHub)** — click **Push categories to GitHub lists** in **Settings → Star Sync**. Each local category is written back as a same-named GitHub List (existing lists overwritten, missing lists created private by default); repos join the lists matching their category, and memberships in lists not managed locally are preserved.

> Scope is persistent: switch anytime between **Starred repos only** and **Starred repos & lists** in Settings → Star Sync.

## 💾 WebDAV Backup Configuration

Back up and sync your data via any standard WebDAV service:

- **Jianguoyun (坚果云)**: recommended for users in China
- **Nextcloud**: self-hosted cloud storage
- **ownCloud**: enterprise-grade option
- **Any standard WebDAV server**

Steps: open Settings, add a WebDAV config, enter the server URL, username, password, and path, test the connection, then enable auto-backup.

WebDAV always goes through the backend proxy (`/api/proxy/webdav`). That is required when the UI is served over HTTPS but your NAS uses `http://` (browsers block mixed content). The **Docker/backend host** must be able to reach the WebDAV URL — a public VPS cannot dial a home-LAN `192.168.x.x` address unless you expose that NAS or run the app on the same network.

## 🚀 Deployment

**Recommended:** full-stack Docker — see [DOCKER.md](DOCKER.md).

The Vite build also produces a static `dist/` for CDN hosting, but the app expects a same-origin backend for login, sync, and proxies. Prefer the Docker image (or put a reverse proxy in front of the full-stack container) instead of static-only hosting.

## Who it's for

Developers with hundreds/thousands of stars
People who systematically track releases
"Lazy-efficient" users who don't want manual tagging

## Additional Notes

1. This is a web app: Docker (or Express + built SPA) is required for normal use. Browser-only static hosting without a backend is not supported for login/sync/proxies.
2. I can't write code, this app is entirely written by the AI, mainly for my personal requirment. If you have a new feature or meet a bug, I can only try to do it, but I can't guarantee it, because it depends on the AI to do it successfully.😹

## 🤝 Contributing

Contributions are welcome!

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

## StarMapper

<a href="https://starmapper.bruniaux.com/AmintaCCCP/GithubStarsManager?utm_source=map-embed&utm_medium=readme&utm_campaign=stargazer-map">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://starmapper.bruniaux.com/api/map-image/AmintaCCCP/GithubStarsManager?theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://starmapper.bruniaux.com/api/map-image/AmintaCCCP/GithubStarsManager?theme=light" />
    <img alt="StarMapper" src="https://starmapper.bruniaux.com/api/map-image/AmintaCCCP/GithubStarsManager" />
  </picture>
</a>

## Star History
<a href="https://github.com/AmintaCCCP/GithubStarsManager">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://starfolio.aminta.top/star-history/githubstarsmanager?theme=dark"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://starfolio.aminta.top/star-history/githubstarsmanager?theme=light"
    />
    <img
      alt="Star history chart"
      src="https://starfolio.aminta.top/star-history/githubstarsmanager?theme=light"
    />
  </picture>
</a>
