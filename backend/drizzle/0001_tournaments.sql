CREATE TABLE IF NOT EXISTS "tournament_rulesets" (
  "id" text PRIMARY KEY NOT NULL,
  "allow_jokers" boolean NOT NULL DEFAULT true,
  "tiles_per_player" integer NOT NULL DEFAULT 14,
  "turn_time_seconds" integer NOT NULL DEFAULT 60,
  "max_players" integer NOT NULL DEFAULT 4,
  "custom_name" text
);

CREATE TABLE IF NOT EXISTS "tournaments" (
  "id" text PRIMARY KEY NOT NULL,
  "creator_user_id" text NOT NULL REFERENCES "users"("id"),
  "name" text NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "max_players" integer NOT NULL DEFAULT 4,
  "entry_fee" integer NOT NULL DEFAULT 0,
  "prize_pool" integer NOT NULL DEFAULT 0,
  "ruleset_id" text REFERENCES "tournament_rulesets"("id"),
  "is_private" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tournament_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "tournament_id" text NOT NULL REFERENCES "tournaments"("id"),
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "paid_entry_fee" integer NOT NULL DEFAULT 0,
  "joined_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tournament_chat_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "tournament_id" text NOT NULL REFERENCES "tournaments"("id"),
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "message" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
