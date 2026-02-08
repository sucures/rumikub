Architecture Vision — Before/After Transformation
Status: Future Vision (Not part of the MVP)
Author: LELC
Last Updated: 2026-01-14

Overview
This document describes the long‑term architectural vision for the Rummikub App project.
It compares the initial architecture (“Before”) with the target architecture (“After”), highlighting improvements in scalability, modularity, performance, and maintainability.

This document is reference only and must not influence the MVP.

Before — Initial Architecture
The initial version of the project was built quickly and had several limitations:

Single backend handling everything (API + game logic + sockets)

No separation of concerns

No horizontal scaling

No analytics

No feature flags

No anti‑cheat

No WASM engine

No crypto integration

UI components not standardized

No monorepo structure

No shared types

No modular packages

No internationalization

No testing strategy

No documentation

This version worked for prototyping but was not scalable.

After — Target Architecture
The future architecture introduces a professional, modular, scalable system:

3.1 Monorepo

Turborepo

Shared packages

Unified types

Reusable UI components

Shared game engine

3.2 Dedicated Game Server

Real‑time engine

Anti‑cheat

Replay system

Matchmaking

Horizontal scaling with Redis

Deterministic state management

3.3 API Server

Authentication

Payments

Shop

Wallet

Tournaments

Leaderboards

Social features

Admin tools

Queues

Analytics ingestion

3.4 Game Engine (Rust + WASM)

High‑performance validation

AI logic

Solver

Scoring

Deterministic execution

3.5 Feature Flags

Unleash integration

Progressive rollouts

A/B testing

3.6 Analytics System

Mixpanel

Amplitude

Firebase

Custom backend analytics

3.7 Crypto Integration

Off‑chain signatures (EIP‑712)

On‑chain settlement

Escrow contract

Secure prize claims

3.8 Internationalization

10+ languages

Dynamic namespace loading

Language detection

3.9 UI Component Library

Shared design system

Animations

Themes

Game components

Benefits of the New Architecture

Horizontal scalability

Faster development

Shared logic across apps

Strong separation of concerns

Better performance

Easier testing

Future‑proof design

Professional documentation

Modular and maintainable codebase

Risks & Considerations

Requires more infrastructure

More complex deployment

Higher initial development cost

Needs strong DevOps practices

Not required for the MVP

Implementation Status
This architecture is not implemented.
It represents the long‑term vision for the project.

Decision
This document is for reference only.
It must not influence the MVP unless explicitly requested.