ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" text UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referrals_count" integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "referral_rewards" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "referred_user_id" text NOT NULL REFERENCES "users"("id"),
  "reward_coins" integer NOT NULL DEFAULT 0,
  "reward_gems" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "referral_clicks" (
  "id" text PRIMARY KEY NOT NULL,
  "referral_code" text NOT NULL,
  "ip" text,
  "user_agent" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
