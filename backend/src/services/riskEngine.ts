/**
 * Minimal risk-based 2FA engine (Step Security.10 Phase 2).
 */
import type { UserDeviceRow } from '../db/schema.js';
import {
  riskThreshold2FARequired,
  riskNewDeviceDays,
  riskRecoveryFirstNOps,
  riskHighAmountThreshold,
} from '../config/security.js';

export type RiskContext = {
  userId: string;
  device: UserDeviceRow;
  ip?: string;
  operation: string;
  amount?: number;
  hasBackedUpSeed: boolean;
  isRecovered: boolean;
  recoveryOpsCount?: number;
  isTrusted: boolean;
};

export type RiskResult = {
  score: number;
  require2FA: boolean;
  factors: string[];
};

export function evaluateRisk(ctx: RiskContext): RiskResult {
  const factors: string[] = [];
  let score = 0;

  const now = Date.now();
  const deviceAgeMs = ctx.device.createdAt ? now - new Date(ctx.device.createdAt).getTime() : 0;
  const deviceAgeDays = deviceAgeMs / (24 * 60 * 60 * 1000);

  if (deviceAgeDays < riskNewDeviceDays) {
    score += 2;
    factors.push('NEW_DEVICE');
  }

  if (ctx.isRecovered) {
    score += 2;
    factors.push('RECOVERED_DEVICE');
  }

  if (ctx.isRecovered && (ctx.recoveryOpsCount ?? 0) < riskRecoveryFirstNOps) {
    score += 3;
    factors.push('RECENT_RECOVERY');
  }

  // IP change: would need lastSeenIp in user_devices; skip if not available
  const meta = (ctx.device.metadata ?? {}) as Record<string, unknown>;
  const lastSeenIp = meta.lastSeenIp as string | undefined;
  if (ctx.ip && lastSeenIp && ctx.ip !== lastSeenIp) {
    score += 1;
    factors.push('IP_CHANGE');
  }

  if ((ctx.amount ?? 0) > riskHighAmountThreshold) {
    score += 2;
    factors.push('HIGH_AMOUNT');
  }

  if (!ctx.hasBackedUpSeed) {
    score += 2;
    factors.push('SEED_NOT_BACKED_UP');
  }

  const require2FA = score >= riskThreshold2FARequired;

  return {
    score,
    require2FA,
    factors,
  };
}
