# Build & Deployment

Production build and deployment instructions for **Rummikub** (frontend + backend).

---

## 1. Production builds

### Frontend (Vite)

From the **repository root**:

```bash
npm ci
npm run build
```

- Output: `dist/` (static assets).
- Set `VITE_API_URL` and `VITE_WS_URL` before building so the client points to your API and WebSocket host.

```bash
export VITE_API_URL=https://your-api.example.com
export VITE_WS_URL=https://your-api.example.com
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Backend (Node)

From the **repository root** (so `shared/` is available for imports):

```bash
cd backend
npm ci
npm run build
```

- Output: `backend/dist/`.
- Start: `node backend/dist/server.js` (must be run from **repo root** so `backend/dist` and `shared/` resolve correctly).

From repo root:

```bash
node backend/dist/server.js
```

Or from `backend/` after building (requires `shared` to be present at `../shared` or path adjusted):

```bash
cd backend
npm run start
```

**Note:** Backend code imports `../../../shared`. So when running `node dist/server.js` from inside `backend/`, the parent of `backend/` must be the repo root and `shared/` must exist at repo root. For deployment, either run from repo root with `node backend/dist/server.js`, or use the provided Dockerfile.

---

## 2. Environment variables

### Backend (`.env` in `backend/` or in the host)

| Variable        | Required | Description |
|----------------|----------|-------------|
| `NODE_ENV`     | No       | `production` in production. |
| `PORT`         | No       | Server port (default `3000`). |
| `FRONTEND_URL` | Yes (prod) | Allowed CORS origin(s), comma-separated. |
| `JWT_SECRET`   | Yes      | Secret for JWT (min 32 chars). |
| `DATABASE_URL` | Yes      | PostgreSQL connection string. |

Copy from `backend/.env.example` and fill in values.

### Frontend (build-time)

| Variable         | Required | Description |
|------------------|----------|-------------|
| `VITE_API_URL`   | Yes (prod) | Backend API base URL (no trailing slash). |
| `VITE_WS_URL`    | Yes (prod) | WebSocket URL (same host as API in most cases). |

Copy from `.env.example` at repo root and set before `npm run build`.

---

## 3. CORS

- **Production:** Set `FRONTEND_URL` to your frontend origin(s). Multiple origins: comma-separated. Only these origins are allowed for API and WebSocket.
- **Development:** If `FRONTEND_URL` is unset or `NODE_ENV` is not `production`, CORS allows any origin.

---

## 4. Logging

- **Production:** Each request is logged as `METHOD path STATUS ms` after the response finishes. Responses with status ≥ 500 are logged to stderr.
- **Development:** Only 5xx responses are logged.

---

## 5. Health check

- **Endpoint:** `GET /health`
- **Auth:** None.
- **Response:** `{ "status": "ok", "timestamp": "<ISO>", "env": "production" }`

Use this for load balancers and monitoring.

---

## 6. Deploy to Render

1. Create a [Render](https://render.com) account and connect your Git repo.
2. **PostgreSQL:** Dashboard → New → PostgreSQL. Create a database and note the **Internal Connection String** (or use the one from the Blueprint).
3. **Backend (Web Service):**
   - New → Web Service → Connect this repo.
   - **Root Directory:** leave empty (repo root).
   - **Build Command:** `cd backend && npm ci && npm run build`
   - **Start Command:** `node backend/dist/server.js`
   - **Instance Type:** Free (or paid).
   - **Environment:** Add `NODE_ENV=production`, `FRONTEND_URL` (your frontend URL), `JWT_SECRET`, and `DATABASE_URL` (from the PostgreSQL service).
4. **Blueprint (optional):** If your repo has `render.yaml`, use **New → Blueprint** and select the repo. It will create the web service and Postgres from the spec. Then set `FRONTEND_URL` in the service environment.
5. After deploy, note the backend URL (e.g. `https://rummikub-api.onrender.com`).
6. **Frontend (Static Site):**
   - New → Static Site → Connect same repo.
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
   - **Environment:** `VITE_API_URL=https://your-backend-url.onrender.com`, `VITE_WS_URL=https://your-backend-url.onrender.com`
   - Deploy. Then set the backend’s `FRONTEND_URL` to this static site URL.

---

## 7. Deploy to Railway

1. Create a [Railway](https://railway.app) project and connect the repo.
2. **Backend:** Add a service from this repo.
   - **Root Directory:** leave default (repo root).
   - **Build:** `cd backend && npm ci && npm run build`
   - **Start:** `node backend/dist/server.js`
   - **Health check:** Set path to `/health` in service settings (or use `railway.toml`).
   - Add env vars: `NODE_ENV`, `FRONTEND_URL`, `JWT_SECRET`, `DATABASE_URL`.
3. **Config as code:** This repo includes `railway.toml` with build, start, and health check settings.
4. **PostgreSQL:** Add a PostgreSQL plugin in the same project and link `DATABASE_URL` to the backend service.
5. Deploy and set `FRONTEND_URL` to your frontend URL.
6. **Frontend:** Deploy separately (e.g. static site on Railway or Vercel/Netlify) with `VITE_API_URL` and `VITE_WS_URL` set to the Railway backend URL.

---

## 8. Deploy to Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/) and log in: `fly auth login`.
2. **Backend (Docker):** From repo root (this repo includes `fly.toml` at root):

   ```bash
   fly launch --name rummikub-api
   # or, if the app already exists:
   fly deploy
   ```

3. Set secrets:

   ```bash
   fly secrets set JWT_SECRET=your-secret DATABASE_URL=postgres://... FRONTEND_URL=https://your-frontend.fly.dev
   ```

4. **PostgreSQL:** Create a Postgres app on Fly (or use an external DB) and set `DATABASE_URL`.
5. Deploy: `fly deploy`.
6. **Frontend:** Deploy as a static site (e.g. `fly launch` with a static Dockerfile or use another host) and set `VITE_API_URL` / `VITE_WS_URL` to your Fly backend URL.

A `fly.toml` at repo root is included; it points to `backend/Dockerfile`. From repo root run `fly deploy`.

---

## 9. Docker (backend only)

Build from **repository root** (so `shared/` and `backend/` are in context):

```bash
docker build -f backend/Dockerfile -t rummikub-backend .
```

Run:

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e FRONTEND_URL=https://your-frontend.com \
  -e JWT_SECRET=your-secret \
  -e DATABASE_URL=postgresql://... \
  rummikub-backend
```

Or use `--env-file backend/.env` (do not commit `.env`).

---

## 10. Checklist

- [ ] Backend: `NODE_ENV=production`, `FRONTEND_URL`, `JWT_SECRET`, `DATABASE_URL` set.
- [ ] Backend: Run migrations (e.g. `cd backend && npm run db:push` or your migration command) against the production DB.
- [ ] Frontend: `VITE_API_URL` and `VITE_WS_URL` set at build time and pointing to the deployed backend.
- [ ] CORS: `FRONTEND_URL` matches the exact frontend origin (scheme + host + port if non-default).
- [ ] Health: `GET https://your-api/health` returns 200.
