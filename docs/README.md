# Rummikub App — Technical Documentation Index

**Author:** LELC  
**Last Updated:** 2026-02-07

Welcome to the technical documentation for the Rummikub App project.

---

## Core Documentation (MVP)

| Document | Description |
|----------|-------------|
| [API_REFERENCE.md](API_REFERENCE.md) | REST API and WebSocket events reference |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | PostgreSQL schema, users table, Drizzle |
| [GAME_FLOW.md](GAME_FLOW.md) | Game flow: room lifecycle, turns, moves, scoring |
| [AUTH_FLOW.md](AUTH_FLOW.md) | JWT authentication, registration, login, WebSocket auth |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Authoritative project directory structure |

### Build & Deployment

| Document | Description |
|----------|-------------|
| [../DEPLOYMENT.md](../DEPLOYMENT.md) | Production build, env vars, CORS, Render, Railway, Fly.io, Docker |

---

## Architecture (`/docs/architecture`)

High-level documents describing system architecture, engines, and shared components.

| Document | Description |
|----------|-------------|
| [monorepo.md](architecture/monorepo.md) | Full monorepo structure and package overview |
| [game-server-colyseus.md](architecture/game-server-colyseus.md) | Dedicated Colyseus-based game server |
| [wasm-engine.md](architecture/wasm-engine.md) | Rust + WebAssembly game engine architecture |
| [feature-flags.md](architecture/feature-flags.md) | Feature flag system using Unleash |
| [analytics.md](architecture/analytics.md) | Unified analytics system |

---

## Systems (`/docs/systems`)

Documents describing functional modules and subsystems.

| Document | Description |
|----------|-------------|
| [anti-cheat.md](systems/anti-cheat.md) | Anti-cheat detection system |
| [crypto-integration.md](systems/crypto-integration.md) | Off-chain + On-chain crypto integration |
| [i18n.md](systems/i18n.md) | Full internationalization system |

---

## Future Vision (`/docs/future`)

Long-term architectural goals.

| Document | Description |
|----------|-------------|
| [architecture-vision.md](future/architecture-vision.md) | Before/After comparison and large-scale system vision |

---

## Current MVP Stack

- **Backend:** Express + Socket.io
- **Game logic:** Shared TypeScript
- **Database:** PostgreSQL (Drizzle ORM)
- **Frontend:** React + Vite
- **Auth:** JWT, bcrypt

---

## How to Use This Documentation

| Use case | Where to look |
|----------|---------------|
| Daily development (API, auth, game rules, DB) | Core docs (above) |
| Architecture and subsystems | `/architecture`, `/systems` |
| Roadmap and scaling | `/future` |
| Deployment | [DEPLOYMENT.md](../DEPLOYMENT.md) |
| Technical decisions | Check the "Decision" section in each document |

---

**Status:** Documentation generated and organized. Last updated: 2026-02-07.
