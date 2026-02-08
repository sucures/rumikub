/**
 * require2FA middleware (Step Security.2 + Security.10 Phase 2).
 * If 2FA is enabled for the user, requires X-2FA-Code, X-Email-OTP, or X-SMS-OTP and validates.
 * Phase 2: risk-based — only enforce 2FA when evaluateRisk returns require2FA = true.
 */
import type { Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import type { AuthRequest } from './auth.js';
import { verify2FACode } from '../services/twoFactorService.js';
import { evaluateRisk } from '../services/riskEngine.js';
import { logAudit } from '../services/auditService.js';
import { db } from '../db/index.js';
import { userSecurity, userDevices } from '../db/schema.js';

export function require2FAForWalletOps(operation: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' });
      return;
    }

    const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'].trim() : '';

  let device: typeof userDevices.$inferSelect | null = null;
  if (deviceId) {
    const devRows = await db
      .select()
      .from(userDevices)
      .where(and(eq(userDevices.userId, userId), eq(userDevices.deviceId, deviceId)))
      .limit(1);
    device = devRows[0] ?? null;
  }

  const secRows = await db
    .select({ seedBackedUp: userSecurity.seedBackedUp })
    .from(userSecurity)
    .where(eq(userSecurity.userId, userId))
    .limit(1);

  const hasBackedUpSeed = secRows[0]?.seedBackedUp ?? false;
  const meta = (device?.metadata ?? {}) as Record<string, unknown>;
  const isRecovered = meta.recovered === true || meta.assistedRecovery === true;
  const recoveryOpsCount = meta.recoveryOpsCount as number | undefined;

  const riskResult = evaluateRisk({
    userId,
    device: device ?? ({} as typeof userDevices.$inferSelect),
    ip: typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
      : req.socket?.remoteAddress,
    operation,
    amount: typeof req.body?.amount === 'number' ? req.body.amount : req.body?.amount != null ? Number(req.body.amount) : undefined,
    hasBackedUpSeed,
    isRecovered,
    recoveryOpsCount,
    isTrusted: device?.isTrusted ?? false,
  });

  if (riskResult.require2FA) {
    logAudit('HIGH_RISK_OPERATION', {
      score: riskResult.score,
      factors: riskResult.factors,
      operation,
      amount: req.body?.amount,
    }, userId, deviceId || undefined);

    const totpCode = req.headers['x-2fa-code'] as string | undefined;
    const emailOtp = req.headers['x-email-otp'] as string | undefined;
    const smsOtp = req.headers['x-sms-otp'] as string | undefined;
    const valid = await verify2FACode(userId, totpCode, emailOtp, smsOtp);
    if (!valid) {
      res.status(403).json({
        success: false,
        error: 'Invalid or missing 2FA code',
        code: 'TWO_FACTOR_REQUIRED',
      });
      return;
    }
  }

  next();
  };
}
