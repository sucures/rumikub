CREATE TABLE IF NOT EXISTS "tournament_rounds" (
  "id" text PRIMARY KEY NOT NULL,
  "tournament_id" text NOT NULL REFERENCES "tournaments"("id"),
  "round_number" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tournament_matches" (
  "id" text PRIMARY KEY NOT NULL,
  "tournament_id" text NOT NULL REFERENCES "tournaments"("id"),
  "round_number" integer NOT NULL,
  "table_number" integer NOT NULL DEFAULT 1,
  "player1_id" text REFERENCES "users"("id"),
  "player2_id" text REFERENCES "users"("id"),
  "winner_id" text REFERENCES "users"("id"),
  "game_id" text,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tournament_results" (
  "id" text PRIMARY KEY NOT NULL,
  "tournament_id" text NOT NULL REFERENCES "tournaments"("id"),
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "position" integer NOT NULL,
  "reward_coins" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
