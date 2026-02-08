# Project Structure

Quick reference for the Rummikub Pro project layout.  
For the **authoritative, detailed structure**, see [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

---

## Overview

| Layer | Path | Description |
|-------|------|-------------|
| Frontend | `src/` | Vite + React app (runs from repo root) |
| Backend | `backend/` | Express + Socket.io API |
| Shared | `shared/` | TypeScript types shared by frontend and backend |
| Supplementary UI | `frontend/` | Extra components (Theme, Shop, Community, etc.) |
| Docs | `docs/` | API, DB, game flow, auth, structure |

---

## Key Paths

| Purpose | Path |
|---------|------|
| Frontend entry | `index.html`, `src/main.tsx` |
| API client | `src/api/client.ts` |
| Socket hook | `src/hooks/useSocket.ts` |
| Game state | `src/store/gameStore.ts` |
| Backend entry | `backend/src/server.ts` |
| Database schema | `backend/src/db/schema.ts` |
| Shared types | `shared/types.ts` |

---

## Deployment Configs

| File | Platform |
|------|----------|
| `render.yaml` | Render Blueprint |
| `fly.toml` | Fly.io |
| `railway.toml` | Railway |
| `backend/Dockerfile` | Docker |

---

## Documentation

- [docs/README.md](docs/README.md) — Documentation index
- [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) — Full directory tree
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) — REST + WebSocket
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — Database
- [docs/GAME_FLOW.md](docs/GAME_FLOW.md) — Game flow
- [docs/AUTH_FLOW.md](docs/AUTH_FLOW.md) — Auth flow
- [DEPLOYMENT.md](DEPLOYMENT.md) — Build & deployment
