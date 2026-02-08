ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" text;

CREATE TABLE IF NOT EXISTS "friends" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "friend_id" text NOT NULL REFERENCES "users"("id"),
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "follows" (
  "id" text PRIMARY KEY NOT NULL,
  "follower_id" text NOT NULL REFERENCES "users"("id"),
  "following_id" text NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
