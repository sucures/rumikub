Rummikub App — Monorepo Architecture Documentation
Status: Reference Documentation
Author: Luis
Last Updated: 2026-01-14

Overview
This document describes the full architecture of the Rummikub App monorepo, including shared packages, the game engine, UI components, analytics SDK, API server, game server, and web application.
It serves as the master map of the entire project.

Monorepo Structure
The repository is organized as follows:

packages/ — Shared libraries
apps/ — Applications

This structure enables:

Code reuse

Shared types and utilities

Faster builds with Turborepo caching

Consistent architecture across apps

Packages

3.1 @rummikub/core — Shared Core
Contains:

Game types

User types

Room types

Tournament types

Crypto types

Chat types

API response types

WebSocket event types

Constants (game, tiles, rules, errors, events, limits)

Validators (game, room, user)

Schemas (auth, game, room)

Utilities (crypto, formatting, random, time, id)

This package is the backbone of the entire project.

3.2 @rummikub/game-engine — Game Engine
Hybrid architecture:

Rust (WASM)

lib.rs

board.rs

tile.rs

validation.rs

solver.rs

scoring.rs

Rust tests

WebAssembly Bindings

wasm/pkg

build.sh

TypeScript Wrapper

engine.ts

board.ts

moves.ts

AI (easy, medium, hard, expert)

This engine provides:

Move validation

AI logic

Solver

Scoring

Full board validation

3.3 @rummikub/ui — Shared UI Components
Includes:

Primitives (Button, Input, Modal, Card, Avatar, Badge, Tooltip, Toast, Dropdown, Skeleton)

Game components (Tile, TileStack, TileGroup, GameBoard, BoardGrid, DropZone, PlayerHand, HandSorter, Timer, ScoreBoard, TurnIndicator)

Feedback components (LoadingSpinner, ProgressBar, Confetti, ErrorBoundary)

Layout components (Header, Footer, Sidebar, Container)

Hooks (useClickOutside, useKeyboard, useMediaQuery, useDebounce, useThrottle, useDragAndDrop, useAnimation, useSound)

Animations (tile, page, modal)

Themes (classic, modern, dark, neon, nature, ocean, sunset, midnight, gold, diamond)

This is a professional-grade UI library.

3.4 @rummikub/analytics — Analytics SDK
Includes:

Event tracker

Event definitions

Providers (Mixpanel, Amplitude, Firebase, Custom backend)

Applications

4.1 API Server (Express)
Includes:

Authentication

Users

Profiles

Rooms

Matchmaking

Tournaments

Payments

Crypto

Shop

Rewards

Partners

Social

Chat

Leaderboards

Notifications

Admin

Health checks

Middlewares

Prisma + Redis + MongoDB

Queues (Bull)

Utilities

Tests

Dockerfile

This is a complete, modular, scalable backend.

4.2 Game Server (WebSocket)
Includes:

GameManager

RoomManager

PlayerManager

TurnManager

StateManager

TimerManager

Game logic

Replay system

Anti-cheat

Matchmaking

Persistence

Scaling (Cluster + Redis Adapter)

Middlewares

Utilities

Tests

Dockerfile

This is a dedicated, scalable real-time game server.

4.3 Web App (React)
Includes:

App shell

Routing

Providers

Pages (home, game, lobby, tournament, shop, wallet, profile, leaderboard, social, settings, partner, auth, legal)

Feature-based slices (auth, game, socket)

Components and hooks for each page

This is a complete, modular, scalable web application.

Decision
This document serves as a reference architecture.
It does not imply that all components are part of the current MVP.