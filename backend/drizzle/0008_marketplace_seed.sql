-- Optional: Seed test cosmetic items (Step 24)
-- Run after 0007_marketplace.sql

INSERT INTO cosmetic_items (id, name, type, rarity, price_coins, price_gems, metadata, is_limited, created_at)
VALUES
  ('skin_classic_amber', 'Classic Amber', 'skin', 'common', 50, 0, '{"color":"#f59e0b"}', false, now()),
  ('skin_ocean_blue', 'Ocean Blue', 'skin', 'rare', 150, 0, '{"color":"#3b82f6"}', false, now()),
  ('skin_forest_green', 'Forest Green', 'skin', 'epic', 0, 10, '{"color":"#22c55e"}', false, now()),
  ('board_wooden', 'Wooden Board', 'board', 'common', 100, 0, '{"theme":"wood","color":"#8b5a2b"}', false, now()),
  ('board_marble', 'Marble Board', 'board', 'rare', 250, 0, '{"theme":"marble","color":"#e8e4e0"}', false, now()),
  ('tiles_default', 'Default Tiles', 'tiles', 'common', 0, 0, '{"style":"default"}', false, now()),
  ('tiles_golden', 'Golden Tiles', 'tiles', 'legendary', 500, 25, '{"style":"golden"}', true, now()),
  ('effect_sparkle', 'Sparkle Effect', 'effect', 'rare', 200, 0, '{"animation":"sparkle"}', false, now())
ON CONFLICT (id) DO NOTHING;
