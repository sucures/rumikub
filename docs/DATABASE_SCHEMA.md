# Database Schema

PostgreSQL schema for Rummikub Pro, managed with [Drizzle ORM](https://orm.drizzle.team/).

---

## Overview

- **ORM:** Drizzle
- **Database:** PostgreSQL
- **Schema file:** `backend/src/db/schema.ts`
- **Migrations:** `backend/drizzle/`

---

## Tables

### `users`

Stores user accounts, profiles, and game stats.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `text` | No | — | Primary key (UUID) |
| `email` | `text` | No | — | Unique email |
| `username` | `text` | No | — | Unique username |
| `password_hash` | `text` | No | — | bcrypt hash |
| `avatar` | `text` | Yes | — | Avatar URL |
| `bio` | `text` | Yes | — | User bio |
| `level` | `integer` | No | `1` | User level |
| `experience` | `integer` | No | `0` | Experience points |
| `coins` | `integer` | No | `100` | Rummikub Coins |
| `rum_tokens` | `integer` | No | `0` | RUM tokens (crypto) |
| `premium` | `boolean` | No | `false` | Premium status |
| `stats` | `jsonb` | No | `{}` | Game statistics (see below) |
| `referred_by` | `text` | Yes | — | Referrer user id |
| `created_at` | `timestamp with time zone` | No | `now()` | Creation time |
| `updated_at` | `timestamp with time zone` | No | `now()` | Last update |
| `last_login_at` | `timestamp with time zone` | Yes | — | Last login time |

#### `stats` (JSONB structure)

```json
{
  "gamesPlayed": 0,
  "gamesWon": 0,
  "gamesLost": 0,
  "totalScore": 0,
  "tournamentsWon": 0,
  "longestStreak": 0,
  "currentStreak": 0,
  "bestRank": 0
}
```

---

## Drizzle Schema Definition

```typescript
// backend/src/db/schema.ts (excerpt)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  coins: integer('coins').notNull().default(100),
  rumTokens: integer('rum_tokens').notNull().default(0),
  premium: boolean('premium').notNull().default(false),
  stats: jsonb('stats').$type<{ ... }>().notNull().default({ ... }),
  referredBy: text('referred_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});
```

---

## In-Memory Stores (non-persistent)

The following are held in memory and are not persisted to PostgreSQL:

| Store | Location | Purpose |
|-------|----------|---------|
| Game rooms | `GameRoomService` | Waiting rooms, invite codes, player lists |
| Active games | `activeGameStore` | Live game state, board, hands, pool |
| Socket rooms | Socket.io | `room:<id>`, `game:<id>`, `user:<id>` |

These are cleared on server restart. For persistence of games and rooms, future schema extensions will be needed.

---

## Migrations

Generate and run migrations:

```bash
cd backend
npx drizzle-kit generate
npx drizzle-kit migrate
```

Or push schema directly (development):

```bash
npx drizzle-kit push
```

---

## Connection

Connection string via `DATABASE_URL` in `backend/.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/rummikub
```
