Rummikub App — Technical Documentation Index
Author: LELC
Last Updated: 2026-02-07

Welcome to the technical documentation for the Rummikub App project.
This directory is organized into three main sections:

1. Architecture (/architecture)
High‑level documents describing the system architecture, engines, servers, and shared components.

monorepo.md  — Full monorepo structure and package overview

game-server-colyseus.md  — Architecture for a dedicated Colyseus-based game server

wasm-engine.md  — Rust + WebAssembly game engine architecture

feature-flags.md  — Feature flag system using Unleash

analytics.md  — Unified analytics system

2. Systems (/systems)
Documents describing functional modules and subsystems.

anti-cheat.md  — Anti-cheat detection system

crypto-integration.md  — Off-chain + On-chain crypto integration

i18n.md  — Full internationalization system

3. Future Vision (/future)
Documents representing long-term architectural goals.

architecture-vision.md  — Before/After comparison and large-scale system vision

Important Notes
Documents in /future represent long-term goals and must not influence the current MVP.

Documents in /architecture and /systems serve as reference, not immediate implementation tasks.

The current MVP is based on:

Express + Socket.io

Shared TypeScript game logic

PostgreSQL

React + Vite

Turborepo monorepo

How to Use This Documentation
For daily development → use /architecture and /systems

For roadmap and scaling decisions → use /future

For technical decisions → check the “Decision” section in each document

Status
Documentation generated and organized by Luis + Copilot.
Last updated: 2026-02-07