/**
 * Canonical message format for client-signed wallet ops (Step Security.4 + Security.10).
 * Deterministic JSON serialization for Ed25519 signing.
 */
import { securityDomain, securityChainId } from '../config/security.js';

export type WalletOperation = 'spend' | 'transfer' | 'simulate-payment';

const MESSAGE_TYPE = 'wallet-operation';

/**
 * Recursively sort object keys alphabetically for deterministic JSON.
 */
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
 * Build the canonical message string to sign (Step Security.10).
 */
export function buildCanonicalMessage(
  operation: WalletOperation,
  userId: string,
  timestamp: number,
  nonce: string,
  deviceId: string,
  sessionId: string,
  payload: Record<string, unknown>
): string {
  const msg = {
    chainId: securityChainId,
    deviceId,
    domain: securityDomain,
    nonce,
    operation,
    payload: sortKeys(payload) as Record<string, unknown>,
    sessionId,
    timestamp,
    type: MESSAGE_TYPE,
    userId,
  };
  return JSON.stringify(sortKeys(msg) as Record<string, unknown>);
}
