CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "username" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "avatar" text,
  "bio" text,
  "level" integer NOT NULL DEFAULT 1,
  "experience" integer NOT NULL DEFAULT 0,
  "coins" integer NOT NULL DEFAULT 100,
  "rum_tokens" integer NOT NULL DEFAULT 0,
  "premium" boolean NOT NULL DEFAULT false,
  "stats" jsonb NOT NULL DEFAULT '{"gamesPlayed":0,"gamesWon":0,"gamesLost":0,"totalScore":0,"tournamentsWon":0,"longestStreak":0,"currentStreak":0,"bestRank":0}',
  "referred_by" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_login_at" timestamp with time zone
);
