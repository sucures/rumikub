-- Step Security.10 Phase 2: device_key for per-device cryptographic identity
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS device_key TEXT NULL;
