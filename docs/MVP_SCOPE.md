# MVP Scope and Constraints

**Status:** Active  
**Last updated:** 2026-02-07

This document records the standing rules for the current MVP. All implementation must follow these constraints unless explicitly overridden by the product owner.

---

## Authoritative references

- **PROJECT_STRUCTURE.md** — Authoritative map of the repository structure.
- **TECHNICAL_PLAN.md** — Authoritative implementation plan for the MVP. All steps and architecture follow this document.
- **README.md** — General overview only, not implementation authority.

---

## MVP stack

- **Backend:** Express + Socket.io, shared TypeScript game logic.
- **Database:** **PostgreSQL only.** No MongoDB, Redis, or other databases for MVP unless explicitly requested.
- **Frontend:** React + Vite (root app).
- **Monorepo:** Do **not** introduce Turborepo or restructure into a Turborepo monorepo unless explicitly requested.

---

## Documentation usage

- **/docs** — Reference documentation only. Do not treat as implementation instructions unless explicitly requested.
- **/docs/future** — Long-term architecture. **Never** use for MVP implementation unless explicitly requested.
- **/docs/architecture** and **/docs/systems** — Reference maps only. Use to understand structure; **do not** use for implementation (no code generation from Colyseus, WASM, feature-flags, analytics, anti-cheat, crypto-integration, etc.).

---

## What we do not introduce (unless explicitly requested)

- Colyseus or any dedicated game server
- WASM / Rust game engine
- Feature flags or analytics SDK
- New crypto integration (existing crypto code remains but is not extended)
- Anti-cheat systems
- Any architecture or systems described in /docs/future or /docs/architecture

---

## Working process

- Follow TECHNICAL_PLAN step-by-step.
- Before modifying multiple files: show a plan.
- Before implementing a feature: confirm scope.
- Obtain explicit approval before writing code for a new step.
