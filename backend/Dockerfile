# Production Dockerfile for backend.
# Build from repo root: docker build -f backend/Dockerfile .
# Run: docker run -p 3000:3000 -e PORT=3000 -e FRONTEND_URL=... -e JWT_SECRET=... -e DATABASE_URL=... rummikub-backend

FROM node:20-alpine AS builder

WORKDIR /app

COPY shared ./shared
COPY backend/package.json backend/package-lock.json* backend/tsconfig.json ./
COPY backend/src ./src

RUN npm ci --legacy-peer-deps && npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Compiled code uses ../../../shared (from dist/server.js -> backend -> repo root). So we need shared at repo root.
# Layout: /app = backend content, so /app/dist/server.js; ../../../shared = /shared. Copy shared to /shared.
COPY --from=builder /app/shared /shared
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm ci --omit=dev --legacy-peer-deps

EXPOSE 3000

CMD ["node", "dist/server.js"]
