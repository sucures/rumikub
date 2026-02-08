CREATE TABLE IF NOT EXISTS "cosmetic_items" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "rarity" text NOT NULL DEFAULT 'common',
  "price_coins" integer NOT NULL DEFAULT 0,
  "price_gems" integer NOT NULL DEFAULT 0,
  "metadata" jsonb DEFAULT '{}',
  "is_limited" boolean NOT NULL DEFAULT false,
  "available_from" timestamp with time zone,
  "available_to" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_inventory" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "item_id" text NOT NULL REFERENCES "cosmetic_items"("id"),
  "acquired_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_loadout" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "users"("id"),
  "skin_id" text REFERENCES "cosmetic_items"("id"),
  "board_id" text REFERENCES "cosmetic_items"("id"),
  "tiles_id" text REFERENCES "cosmetic_items"("id"),
  "effect_id" text REFERENCES "cosmetic_items"("id"),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
