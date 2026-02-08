# API Reference

REST API and WebSocket (Socket.io) reference for Rummikub Pro.

---

## Base URLs

| Environment | REST API | WebSocket |
|-------------|----------|-----------|
| Local | `http://localhost:3000/api` | `http://localhost:3000` |
| Production | `https://your-api.example.com/api` | `https://your-api.example.com` |

---

## Authentication (REST)

All protected endpoints require the JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## REST Endpoints

### Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check (status, timestamp, env) |

---

### Auth (`/api/auth`)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/register` | No | `{ email, username, password }` | Register new account; returns `{ user, token }` |
| POST | `/login` | No | `{ email, password }` | Login; returns `{ user, token }` |
| PATCH | `/update` | Yes | `{ username?, avatar?, bio? }` | Update profile |
| POST | `/logout` | Yes | — | Logout; client should discard token |

**Constraints:** `email`, `username`, `password` required; password min 6 chars; email/username trimmed and unique.

---

### Rooms (`/api/rooms`)

All room routes require authentication.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/` | `{ name?, settings?, isPrivate?, password? }` | Create room; returns `{ room }` |
| POST | `/join` | `{ inviteCode, password? }` | Join room by invite code |
| GET | `/public` | — | List public rooms |
| GET | `/:id` | — | Get room by id |
| POST | `/:id/leave` | — | Leave room |
| POST | `/:id/start` | — | Start game (host only) |
| POST | `/matchmaking` | `{ gameMode?, maxPlayers? }` | Find or create public game |

---

### Game (`/api/game`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:id` | Yes | Get game state; caller must be a player in the game |

---

### Partners (`/api/partners`)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/create` | Yes (admin) | partner data | Create partner |
| POST | `/referral` | No | `{ userId, partnerCode }` | Register referral |
| GET | `/stats/:partnerId` | Yes | — | Get partner stats |
| POST | `/process-rewards/:partnerId` | Yes | — | Process pending rewards |

---

### Crypto (`/api/crypto`)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| GET | `/balance/:address` | Yes | — | Get RUM token balance |
| POST | `/purchase` | Yes | `{ userId, itemId, amount, currency, txHash }` | Process crypto purchase |
| POST | `/mint-nft` | Yes | `{ userId, name, description, imageUrl, attributes }` | Mint NFT |
| POST | `/nft/list/:nftId` | Yes | `{ price, currency }` | List NFT for sale |
| POST | `/nft/buy/:nftId` | Yes | `{ buyerId, txHash }` | Buy NFT |
| POST | `/price` | No | body | Get crypto price |

---

### Social (`/api/social`)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| GET | `/youtube/videos` | No | — | Get YouTube channel videos |
| GET | `/youtube/video/:videoId/stats` | No | — | Get video stats |
| POST | `/telegram/send` | No | `{ chatId, message }` | Send Telegram message |
| GET | `/telegram/members` | No | — | Get Telegram channel members |

---

## WebSocket (Socket.io)

Connect to the same host as the REST API. After connection, send `authenticate` with the JWT to associate the socket with a user.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-api.example.com', {
  transports: ['websocket'],
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token }` | Send JWT to link socket to user |
| `join-room` | `{ roomId }` | Join room channel |
| `leave-room` | `{ roomId }` | Leave room channel |
| `join-game` | `{ gameId }` | Join game channel; server emits current `game-state` |
| `leave-game` | `{ gameId }` | Leave game channel |
| `game-move` | `{ gameId, move }` | Submit move; `move`: `{ type, sets?, drawnTileId? }` |
| `game-draw-tile` | `{ gameId }` | Draw a tile from pool |
| `game-end-turn` | `{ gameId }` | End turn without placing |
| `chat-message` | `{ gameId, message }` | Send chat message to game |
| `subscribe-notifications` | `{ userId }` | Subscribe to user notifications |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `error` | `{ message }` | Error message |
| `game-state` | `Game` | Full game state |
| `game-finished` | `{ game, scores }` | Game over; winner and scores |
| `turn-changed` | `{ currentPlayerIndex }` | Next player's turn |
| `chat-message` | `{ gameId, message, ... }` | Chat message broadcast |
| `room-created` | `GameRoom` | Room created (to host) |
| `room-joined` | — | Room joined |
| `player-joined` | `{ player, room }` | Player joined room |

### Move Types

| `move.type` | Description |
|-------------|-------------|
| `meld` | Place new sets on board |
| `manipulate` | Rearrange/add tiles to existing sets |
| `draw` | Draw a tile from pool |
| `end_turn` | End turn without placing |

---

## Response Format

### Success

```json
{
  "success": true,
  "user": { ... },
  "token": "...",
  "room": { ... },
  "game": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": "Error message"
}
```

HTTP status codes: `200`, `201` (success); `400` (bad request); `401` (unauthorized); `403` (forbidden); `404` (not found); `500` (server error).
