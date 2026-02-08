CREATE TABLE IF NOT EXISTS "game_action_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "game_id" text NOT NULL,
  "match_id" text,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "action_type" text NOT NULL,
  "action_payload" jsonb DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "suspicious_events" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "game_id" text,
  "match_id" text,
  "event_type" text NOT NULL,
  "severity" text NOT NULL,
  "details" jsonb DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_reputation" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id"),
  "score" integer NOT NULL DEFAULT 100,
  "last_updated" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_action_logs_game ON game_action_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_game_action_logs_user ON game_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_user ON suspicious_events(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_match ON suspicious_events(match_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_severity ON suspicious_events(severity);
