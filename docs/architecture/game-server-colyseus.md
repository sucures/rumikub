Game Server (Colyseus) — Technical Specification
Status: Future Architecture (Not for current MVP)
Module: Dedicated Game Server
Author: Luis
Last Updated: 2026-01-14

Overview
This document describes an architecture where the game server is separated from the main API and uses Colyseus as the real-time room engine.
The goal is to scale concurrent matches, reduce latency, and isolate game logic from the general backend.

Objectives

Horizontal scalability for thousands of simultaneous matches

Low latency (<50ms) for move processing

Automatic reconnection support

Deterministic game state synchronization

Integration with the game engine (@rummikub/game-engine)

Built‑in anti‑cheat monitoring

Core Components

GameRoom
Location: apps/game-server/src/rooms/GameRoom.ts
Responsibilities:

Manage players

Validate moves

Apply state changes

Control turn timers

Handle reconnection

Broadcast events

Key Features

Real-time Messaging
Handlers include:

"move"

"draw"

"endTurn"

"chat"

Anti-Cheat Integration
Every 5 seconds:
validateGameState()

Reconnection
Players may reconnect within 60 seconds.

Turn Timer
A per-turn countdown is broadcast to all clients.

Integration Points

Game Engine (@rummikub/game-engine)

API Server (authentication, matchmaking)

Redis (horizontal scaling)

Anti-cheat system

Risks & Considerations

Requires separate infrastructure

Needs Redis for multi-instance scaling

More complex than a basic Socket.io  setup

Not required for the MVP

Implementation Status
Not implemented in the current MVP.
Planned for the “Game Server Scaling” milestone.

Decision
Keep this as future architecture.
Do not integrate into the current development plan unless explicitly requested.