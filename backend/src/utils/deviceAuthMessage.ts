/**
 * Device auth message format (Step Security.10 Phase 2).
 * Deterministic JSON for device-key signing.
 */
const DEVICE_DOMAIN = 'RUMI_WALLET_DEVICE_V1';
const MESSAGE_TYPE = 'device-auth';

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = sortKeys((obj as Record<string, unknown>)[k]);
  }
  return sorted;
}

/**
 * Build deterministic device-auth message string.
 */
export function buildDeviceAuthMessage(
  userId: string,
  deviceId: string,
  sessionId: string,
  timestamp: number
): string {
  const msg = {
    deviceId,
    domain: DEVICE_DOMAIN,
    sessionId,
    timestamp,
    type: MESSAGE_TYPE,
    userId,
  };
  return JSON.stringify(sortKeys(msg) as Record<string, unknown>);
}
