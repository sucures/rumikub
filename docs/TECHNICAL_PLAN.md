# Rummikub-Style Game App — Complete Technical Plan

**Document version:** 1.0  
**Date:** February 7, 2025  
**Status:** Awaiting approval before implementation

---

## Executive Summary

This plan covers the full technical design for the Rummikub-style game application. The repo currently has: a **backend** (Express + Socket.io, partial routes and services), a **frontend** (React components under `frontend/src`, but no root `src/` entry or App shell), **shared** types, and **docs**. Critical gaps: no game logic engine, no root frontend entry (`main.tsx`/`App.tsx`), incomplete WebSocket game flow, and missing game/room REST APIs. This document defines architecture, data models, real-time strategy, game engine, multiplayer flow, UI map, APIs, folder-by-folder implementation, and immediate tasks.

---

## 1. Architecture Overview

### 1.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser / PWA)                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  React 18 + Vite  │  Zustand  │  Socket.io-client  │  React Query     │   │
│  │  Tailwind + Framer Motion  │  shared/ types & themeTypes             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │ HTTPS (REST)              │ WSS (Socket.io)
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js)                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐   │
│  │  Express REST API   │  │  Socket.io Server    │  │  Services Layer   │   │
│  │  /api/account       │  │  game:*, room:*,     │  │  gameRoomService  │   │
│  │  /api/game          │  │  chat-message,      │  │  gameLogicService │   │
│  │  /api/rooms         │  │  game-move, etc.    │  │  customGameService│   │
│  │  /api/partners      │  │                     │  │  accountService   │   │
│  │  /api/crypto        │  │                     │  │  chatService      │   │
│  │  /api/social        │  │                     │  │  ...              │   │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────┘   │
│                    │                                    │                    │
│                    └────────────────┬───────────────────┘                    │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Persistence: MongoDB (primary) / Redis (sessions, matchmaking cache) │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SHARED (monorepo-style, importable by frontend & backend)                   │
│  shared/types.ts  │  shared/themeTypes.ts  │  shared/constants.ts (optional)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Frontend

- **Stack:** React 18, TypeScript, Vite (root), Tailwind CSS, Zustand, Socket.io-client, React Query, Framer Motion, react-hot-toast, Zod, react-hook-form.
- **Entry:** Root `index.html` loads `/src/main.tsx`. **Current gap:** No `src/` at repo root and no `main.tsx` or `App.tsx`; frontend UI lives under `frontend/src/components/`.
- **Decision:** Treat **root** as the Vite app: add `src/` at root with `main.tsx`, `App.tsx`, routes, and re-export or move `frontend/src/components` into `src/components` so a single app runs from root. Alternatively, move Vite + index.html into `frontend/` and run dev from `frontend/`; this plan assumes **root as the single frontend app** and consolidating under `src/`.

### 1.3 Backend

- **Stack:** Node.js, Express, TypeScript, Socket.io, Mongoose, Redis, JWT (auth middleware present).
- **Location:** `backend/`. HTTP server and Socket.io share the same `httpServer` in `server.ts`.
- **Existing:** Routes for partners, crypto, social; services for accounts, chat, crypto, custom game, events, game room, partners, profile, rewards, theme. **Missing:** Game logic service, game/room REST routes, and wiring of WebSocket to authoritative game state.

### 1.4 Shared Modules

- **Location:** `shared/`.
- **Contents:** `types.ts` (Tile, GameSet, Player, Game, ChatMessage, User, Tournament, etc.), `themeTypes.ts` (Theme, TileDesign, UserThemeSettings, etc.).
- **Usage:** Both frontend and backend import from `shared/` (e.g. `../../../shared/types`). **Gap:** `CustomGameSettings` is used by frontend but defined only in `backend/.../customGameService.ts`; it must be moved or re-exported from `shared/types.ts`.

---

## 2. Data Models and Game State Structure

### 2.1 Core Game Types (shared/types.ts)

Already defined and stay as-is, with small extensions:

| Type | Purpose |
|------|--------|
| `Tile` | id, value (1–13), color (red/blue/yellow/black), isJoker, optional nftId |
| `GameSet` | id, tiles[], type ('group' \| 'run'), optional playerId |
| `Player` | id, userId, name, avatar, tiles[], score, isBot?, difficulty? |
| `Game` | id, players[], currentPlayerIndex, pool[], board (GameSet[]), gameMode, status, winnerId?, startedAt?, endedAt?, chat? |

### 2.2 Extensions to Add in shared/types.ts

- **Game status:** Keep `'waiting' | 'playing' | 'finished' | 'paused'`; add optional `roundPhase?: 'draw' | 'meld' | 'manipulate'` if needed for UI.
- **CustomGameSettings:** Move from backend into `shared/types.ts` (or shared/game.types.ts) so frontend and backend both import one definition. Fields: betType, betAmount, useRealTokens, timePerMove (10–30), timePerGame?, timeWarning?, initialTiles, allowJokers, minInitialScore, prizeDistribution, maxPlayers, allowRearrange, private, password?.
- **GameRoom (backend):** Already in `gameRoomService`; consider exporting a shared `GameRoomSettings` type in shared so frontend and backend align on room options (maxPlayers, gameMode, timeLimit, initialTiles, allowJokers, minInitialScore, allowRearrange).

### 2.3 Game State (Authoritative on Backend)

Single source of truth per game lives in backend:

- **In-memory (MVP):** A `Map<gameId, GameState>` in a game manager or `gameLogicService`. Optional: persist to MongoDB on turn end or game end for replay/analytics.
- **GameState shape:** Extend `Game` with:
  - `turnStartedAt?: Date` (for per-move timer).
  - `lastMoveAt?: Date`.
  - `poolTotalCount: number` (to validate draws).
  - Optional: `moveHistory: MoveRecord[]` for undo/replay (can be added later).

### 2.4 Persistence (Optional for MVP)

- **Users/accounts:** MongoDB (when implemented); auth middleware already JWT-based.
- **Rooms:** Can stay in-memory in `GameRoomService`; optionally persist active rooms in Redis for multi-instance.
- **Games:** In-memory for active games; optionally save to MongoDB on `status: 'finished'` for history and stats.

---

## 3. Real-Time Communication Strategy (WebSockets)

### 3.1 Transport

- **Library:** Socket.io (already in backend and in root package.json for client).
- **URL:** Same origin as API (e.g. `wss://host` when deployed); dev: `http://localhost:3000` for backend, frontend on 5173 with Socket.io client pointing to 3000.

### 3.2 Connection and Identity

- On connect, client sends `authenticate` with `{ token: string }` (JWT). Server verifies, stores `userId` in socket data, joins socket to `user:${userId}` room. All game/room events use `userId` from socket data.
- Optional: `join-room` / `leave-room` to join `room:${roomId}` and `game:${gameId}` so emissions can target only participants.

### 3.3 Event Map (Socket.io)

| Event (client → server) | Payload | Server action |
|-------------------------|--------|----------------|
| `authenticate` | `{ token }` | Verify JWT, set socket.data.userId, join `user:${userId}` |
| `join-room` | `{ roomId }` | Join `room:${roomId}` |
| `leave-room` | `{ roomId }` | Leave `room:${roomId}` |
| `join-game` | `{ gameId }` | Join `game:${gameId}`; if reconnection, send `game-state` |
| `leave-game` | `{ gameId }` | Leave `game:${gameId}` |
| `game-move` | `{ gameId, move }` | Validate move via game logic, update state, broadcast `game-state` + `turn-changed` |
| `game-draw-tile` | `{ gameId }` | Validate turn, draw from pool, broadcast `game-state` |
| `game-end-turn` | `{ gameId }` | Validate board, advance turn, broadcast `game-state` |
| `chat-message` | `{ gameId, message }` | Persist (optional), broadcast to `game:${gameId}` |
| `subscribe-notifications` | `{ userId }` | Join `notifications:${userId}` (already present) |

| Event (server → client) | When |
|------------------------|------|
| `game-state` | Full or delta game state after join/move/draw/end-turn/reconnect |
| `turn-changed` | After a valid turn end (currentPlayerIndex, turnStartedAt) |
| `player-joined` / `player-left` | Room/game membership changes |
| `game-started` | When host starts game from room |
| `game-finished` | winnerId, final scores |
| `chat-message` | Echo to room/game |
| `error` | Validation or auth errors (e.g. invalid move, not your turn) |

### 3.4 Reconnection

- Client: on reconnect, re-send `authenticate` and `join-game` for current gameId (store in Zustand or sessionStorage). Server: on `join-game`, look up game state and emit `game-state` to that socket so the client can resync.
- Optional: include a `gameVersion` or `sequenceId` in `game-state` so client can ignore stale updates.

---

## 4. Game Logic Engine Design (Rules, Validation, Scoring)

### 4.1 Location and Responsibility

- **Backend:** New `backend/src/services/gameLogicService.ts` (or `backend/src/engine/`). Authoritative for: tile generation, initial deal, move validation, scoring, turn advancement, win condition.
- **Shared (optional):** Pure validation helpers in `shared/` (e.g. `isValidRun`, `isValidGroup`) so frontend can do optimistic UI and backend can reuse the same rules. Prefer implementing in backend first, then extract pure functions to shared if needed.

### 4.2 Rules to Implement

1. **Tile set:** 2× (1–13) per color × 4 colors + 2 jokers = 106 tiles (or per project constants).
2. **Initial deal:** Each player gets N tiles (e.g. 14); one player designated to start (e.g. random or first in list).
3. **First meld:** Minimum initial score (e.g. 30) in one or more sets without using other board tiles.
4. **Run:** 3+ consecutive same-color tiles.
5. **Group:** 3–4 same value, different colors (no duplicate color).
6. **Joker:** Can substitute any tile; one joker per set; optional rule: joker value = position in run.
7. **Manipulation:** After placing initial meld, player may split/merge/rearrange existing sets and add from hand; at end of turn board must be valid (all sets valid) and hand may have decreased.
8. **End of turn:** Player may draw one tile from pool (optional rule: must draw if didn’t meld).
9. **Win:** First player with empty hand (and valid final move) wins. Scoring: losers sum tile values in hand to winner (and optionally to other losers); joker = max penalty (e.g. 30).

### 4.3 Engine API (gameLogicService)

- `createDeck(): Tile[]` — generate full pool, shuffle.
- `deal(pool, players, tilesPerPlayer): { pool, players }` — assign hands, return updated pool and players.
- `validateFirstMeld(sets: GameSet[], minScore): boolean` — check all sets valid and total value ≥ minScore.
- `validateSet(set: GameSet): boolean` — run or group rules.
- `validateBoard(board: GameSet[]): boolean` — every set valid.
- `validateMove(game: Game, playerIndex: number, move: Move): ValidationResult` — check turn, then apply move in a copy and validate board; return success + updated state or error.
- `applyMove(game: Game, move: Move): Game` — immutable update (board, player hand, pool if draw).
- `computeScores(game: Game, winnerIndex: number): Record<playerId, number>` — final settlement.
- `checkWin(player): boolean` — hand empty after a valid move.

### 4.4 Move Representation

Define in shared:

```ts
interface Move {
  type: 'meld' | 'manipulate' | 'draw' | 'end_turn';
  sets?: GameSet[];        // for meld: new sets placed; for manipulate: full board snapshot or diff
  drawnTileId?: string;   // after draw
}
```

Server receives `game-move` with `move: Move`, runs `validateMove` then `applyMove`, then broadcasts `game-state`.

---

## 5. Multiplayer Flow (Matchmaking, Turns, Reconnection)

### 5.1 Room and Matchmaking

- **Create room:** POST `/api/rooms` (or `/api/game/rooms`) with name, settings, isPrivate, password. Backend uses existing `GameRoomService.createRoom`, returns roomId, inviteCode, inviteLink. Socket: host joins `room:${roomId}`.
- **Join by code:** POST `/api/rooms/join` with inviteCode, password. Backend `joinRoomByCode`; socket joins `room:${roomId}`; server emits `player-joined` to room.
- **Public matchmaking:** POST `/api/rooms/matchmaking` with preferences (gameMode, maxPlayers). Backend `findPublicGame` (find or create public room), return room; client joins socket room.
- **Leave room:** POST or socket `leave-room`; backend `leaveRoom`; emit `player-left`. If host leaves, transfer host to next player (already in gameRoomService).

### 5.2 Start Game

- **Start:** Host sends “start” (REST or socket). Backend checks hostId, min 2 players, room status `waiting`. Call `gameRoomService.startGame` → `createGameFromRoom`: use `gameLogicService.createDeck`, `deal`, then create `Game` with board=[], pool, players with hands, currentPlayerIndex=0, status=`playing`. Persist game in memory (and optionally DB). Emit `game-started` with full game state to `room:${roomId}` and have all clients join `game:${gameId}`.

### 5.3 Turn Flow

1. Server emits `game-state` (including currentPlayerIndex, turnStartedAt).
2. Only current player can send `game-move` (meld/manipulate) or `game-draw-tile` or `game-end-turn`.
3. Server validates with `gameLogicService.validateMove` / apply; on success updates in-memory game, then broadcasts `game-state` and `turn-changed`.
4. If time limit per move: server tracks turnStartedAt; if exceeded, auto-end turn (penalty or just advance) and broadcast.
5. On win: set winnerId, status=`finished`, compute scores, emit `game-finished`; optional: call `customGameService.finishCustomGame` for bets and rewards.

### 5.4 Reconnection

- Client stores current `gameId` (and roomId) in Zustand + sessionStorage. On socket reconnect, emit `authenticate` then `join-game` with gameId. Server looks up game; if found and player still in game, emit full `game-state` to that socket. Client replaces local state and continues.

---

## 6. UI/UX Component Map (Frontend)

### 6.1 App Shell and Routing (to be added at root src/)

- `src/main.tsx` — ReactDOM.render, BrowserRouter, QueryClientProvider, optional theme provider.
- `src/App.tsx` — Routes: `/`, `/game`, `/game/:gameId`, `/rooms`, `/shop`, `/profile`, etc.
- `src/pages/` — Home, Game, Rooms, Shop, Profile, Settings, Tournament (placeholders ok for first phase).

### 6.2 Component Tree (existing under frontend/src/components → to live under src/components)

| Area | Component | Purpose |
|------|------------|--------|
| **Common** | Logo | Brand logo (exists) |
| | Button, Modal, Loading | Reusable primitives (to add) |
| **Game** | CustomGameSettings | Room/game settings (exists; fix shared type) |
| | GameBoard | Board with drop zones and placed sets (to add) |
| | PlayerHand | Current player’s tiles, drag to board (to add) |
| | TileSet | Rendered run/group on board (to add) |
| | GameTimer | Per-move or per-game countdown (to add) |
| | ScoreBoard | Player list and scores (to add) |
| | TurnIndicator | Who’s turn (to add) |
| **Tile** | Tile | Single tile (exists as CustomTile) |
| **Room** | RoomList | Public/private room list (to add) |
| | RoomCreator | Create room form (to add) |
| | RoomInvite | Invite code/link (to add) |
| **Chat** | GameChat | In-game chat (to add) |
| **Theme** | ThemeCustomizer | Theme/sounds (exists) |
| **Shop** | CryptoPurchase | Crypto checkout (exists) |
| **Community** | SocialLinks | Social links (exists) |

### 6.3 Game Page Flow

1. **Lobby:** Room list or “Create room” / “Join by code” / “Quick match”. After join, show Room view: players, settings, invite link, Start (host only).
2. **In-game:** GameBoard (center), PlayerHand (bottom), ScoreBoard (side/top), TurnIndicator, GameTimer, GameChat (optional panel). On `game-state` update, Zustand updates and components re-render.
3. **End game:** Modal with winner and scores; actions: “New game”, “Leave”, “Back to lobby”.

---

## 7. API Endpoints and Backend Services

### 7.1 REST Endpoints to Add or Confirm

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Already exists |
| POST | /api/auth/register | No | Register (to add; accountService) |
| POST | /api/auth/login | No | Login, returns JWT (to add) |
| GET | /api/account/me | Yes | Current user (to add) |
| POST | /api/rooms | Yes | Create room (gameRoomService) |
| POST | /api/rooms/join | Yes | Join by code (gameRoomService) |
| GET | /api/rooms/:id | Yes | Room info (gameRoomService) |
| POST | /api/rooms/:id/leave | Yes | Leave room |
| POST | /api/rooms/:id/start | Yes | Start game (host only) |
| GET | /api/rooms/public | Yes | List public rooms (gameRoomService.getPublicRooms) |
| GET | /api/game/:id | Yes | Get game state (for reload/reconnect) |
| GET | /api/partners/* | As now | Keep |
| GET/POST | /api/crypto/* | As now | Keep |
| GET/POST | /api/social/* | As now | Keep |

### 7.2 Backend Services Summary

| Service | Role |
|---------|------|
| gameRoomService | Create/join/leave room, start game, matchmaking; uses gameLogicService for createGameFromRoom (deal, etc.) |
| gameLogicService | New. Deck, deal, validate/apply move, scores, win check. |
| customGameService | Bets, lock/release, prize distribution; called when game finishes if custom game. |
| accountService | Register, login, profile (to wire to routes). |
| chatService | In-game and private chat (optional persistence). |
| Others | profile, reward, event, partner, crypto, theme — keep as-is and wire as needed. |

---

## 8. Folder-by-Folder Implementation Plan

### 8.1 shared/

- Add `CustomGameSettings` and `GameRoomSettings` (or equivalent) to `shared/types.ts` so frontend and backend share one definition.
- Add `Move` and optional `MoveResult` / `ValidationResult` types.
- Optional: `shared/constants.ts` for tile counts, min meld score, default time limits.

### 8.2 backend/

- **backend/src/services/gameLogicService.ts** — Implement deck creation, deal, validateSet, validateBoard, validateMove, applyMove, computeScores, checkWin. Use shared types.
- **backend/src/server.ts** — Wire Socket.io: authenticate, join-room, leave-room, join-game, leave-game, game-move, game-draw-tile, game-end-turn; on join-game send game-state; on move validate and broadcast.
- **backend/src/routes/** — Add `roomRoutes.ts` (create, join, leave, start, list public), `gameRoutes.ts` (get game by id), `authRoutes.ts` (register, login). Mount in server.ts.
- **backend/src/services/gameRoomService.ts** — In `createGameFromRoom`, call gameLogicService to build deck, deal, and fill game.pool and game.players[].tiles. Store active game in a Map or via gameLogicService so socket handlers can access it.
- **backend/src/config/** — Add database/Redis if needed; keep .env for JWT_SECRET, FRONTEND_URL, etc.

### 8.3 Frontend (root src/)

- **src/main.tsx** — Create React root, Router, QueryClient, theme provider.
- **src/App.tsx** — Route list and layout (header/footer if any).
- **src/pages/Home.tsx**, **src/pages/Game.tsx** (game by id), **src/pages/Rooms.tsx** — Minimal placeholders that render something and link to each other.
- **src/store/gameStore.ts** — Zustand: game state, currentGameId, roomId, setGameState (from socket), actions for join/leave/move (call socket).
- **src/store/userStore.ts** — Optional: user, token, setUser, logout.
- **src/hooks/useSocket.ts** — Connect to backend Socket.io, emit authenticate on mount if token, expose emit/subscribe; optional: auto join-game when gameId in store.
- **src/api/client.ts** — Axios instance with baseURL and Authorization header from token.
- **src/api/rooms.ts** — createRoom, joinRoom, getRoom, leaveRoom, startGame, getPublicRooms.
- **src/api/auth.ts** — login, register (when backend has them).
- **src/components/** — Move or re-export from `frontend/src/components` into `src/components` (Game, Tile, Room, Chat, Theme, Shop, Community, common). Fix CustomGameSettings import to use shared types.
- **src/pages/Game.tsx** — Load game by id (from route param); subscribe to socket for game-state; render GameBoard, PlayerHand, ScoreBoard, TurnIndicator, Timer, Chat. Use gameStore and useSocket.

### 8.4 Root / Vite

- Ensure `index.html` script stays `/src/main.tsx` and that `src/` lives at repo root (current index expects root src/). Add `src/main.tsx` and `src/App.tsx` and the pages above.
- Vite alias: add `@` → `src/` and optionally `@shared` → `shared/` for cleaner imports.
- Environment: `VITE_API_URL` and `VITE_WS_URL` for API and Socket.io base URLs.

---

## 9. Tasks to Execute Immediately (After Approval)

Suggested order; each can be a single PR or iteration.

1. **Shared types** — Add `CustomGameSettings` (and optionally `GameRoomSettings`, `Move`) to `shared/types.ts`. Fix frontend `CustomGameSettings` import to use shared type.
2. **Game logic service** — Implement `backend/src/services/gameLogicService.ts`: createDeck, deal, validateSet (run/group), validateBoard, validateMove, applyMove, computeScores, checkWin. No HTTP/socket yet.
3. **Room REST API** — Add `backend/src/routes/roomRoutes.ts` (create, join, leave, start, list public) and mount in server. Use existing gameRoomService; in startGame, use gameLogicService for deal and initial state.
4. **Socket game flow** — In server.ts: authenticate, join-room, join-game, leave-game; on join-game emit full game-state; handle game-move (validate + apply via gameLogicService, broadcast game-state and turn-changed); handle game-draw-tile and game-end-turn.
5. **Frontend shell** — Add root `src/main.tsx`, `src/App.tsx`, and routes (Home, Game, Rooms). Add `src/api/client.ts` and `src/api/rooms.ts`. Add `src/store/gameStore.ts` and `src/store/userStore.ts` (minimal). Add `src/hooks/useSocket.ts` connecting to backend.
6. **Game room UI** — Rooms page: list public rooms, create room, join by code. After join, show room lobby (players, invite link, start button for host). On start, navigate to `/game/:gameId`.
7. **Game page and board** — Game page: load game from API or only from socket; render GameBoard (placeholders for sets), PlayerHand (tiles from state), ScoreBoard, TurnIndicator. Connect move actions to socket (game-move, game-draw-tile, game-end-turn) and update gameStore from game-state events.
8. **Tile and board logic** — Implement drag-and-drop or click-to-place for tiles; send move payload (meld or manipulate) to socket; show validation errors from server.
9. **Timer and reconnection** — Optional: per-move timer in backend and GameTimer in UI. Reconnection: persist gameId in store/sessionStorage, on useSocket connect re-send join-game and replace state from game-state.
10. **Polish** — Auth routes (register/login) and token storage; optional game history persistence; tests for gameLogicService and one E2E for create room → start → one move.

---

## Document Control

- **Next step:** Obtain your approval on this plan. After approval, implementation will start with the tasks in Section 9 in the order above (or in an order you specify).
- **Changes:** Any change to architecture or scope will be reflected in an updated TECHNICAL_PLAN.md.
