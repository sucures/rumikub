ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gems" integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "type" text NOT NULL,
  "currency" text NOT NULL,
  "amount" integer NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "store_items" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "price_gems" integer,
  "price_coins" integer,
  "metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "purchases" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "item_id" text NOT NULL REFERENCES "store_items"("id"),
  "amount" integer NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
