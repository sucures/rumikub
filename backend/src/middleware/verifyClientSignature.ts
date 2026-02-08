/**
 * verifyClientSignature middleware (Step Security.4 + Security.5 + Security.10).
 * Verifies Ed25519 signature and per-device nonce for wallet ops.
 */
import type { Response, NextFunction } from 'express';
import { eq, and, or, isNull, ne } from 'drizzle-orm';
import type { AuthRequest } from './auth.js';
import { db } from '../db/index.js';
import { userSecurity, userDevices } from '../db/schema.js';
import { buildCanonicalMessage } from '../utils/canonicalMessage.js';
import type { WalletOperation } from '../utils/canonicalMessage.js';
import { verifyEd25519 } from '../utils/signatureVerification.js';
import { signatureMaxAgeMs } from '../config/security.js';
import { logAudit } from '../services/auditService.js';

const LOG_PREFIX = '[verifyClientSignature]';

function logInfo(msg: string) {
  console.info(`${LOG_PREFIX} ${msg}`);
}

function logWarn(msg: string) {
  console.warn(`${LOG_PREFIX} ${msg}`);
}

function sendError(res: Response, code: string, error: string, status = 400) {
  res.status(status).json({ success: false, error, code });
}

/**
 * Middleware factory: verify client signature for a wallet operation.
 */
export function verifyClientSignature(operation: WalletOperation) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      sendError(res, 'SIGNATURE_MALFORMED', 'Not authenticated');
      return;
    }

    const deviceIdHeader = req.headers['x-device-id'] as string | undefined;
    const deviceId = typeof deviceIdHeader === 'string' ? deviceIdHeader.trim() : '';
    if (!deviceId) {
      logWarn('invalid signature attempt: missing X-Device-Id');
      sendError(res, 'DEVICE_ID_REQUIRED', 'X-Device-Id is required');
      return;
    }

    // Step Security.10 Phase 2: session ↔ device binding
    const sessionDeviceId = (req.user as { deviceId?: string })?.deviceId;
    if (sessionDeviceId && sessionDeviceId !== deviceId) {
      logWarn(`device mismatch: session=${sessionDeviceId}, header=${deviceId}`);
      logAudit('DEVICE_SESSION_MISMATCH', { sessionDeviceId, headerDeviceId: deviceId }, userId, deviceId);
      sendError(res, 'DEVICE_SESSION_MISMATCH', 'Session bound to different device', 403);
      return;
    }

    const sig = req.headers['x-signature'] as string | undefined;
    const tsStr = req.headers['x-signature-timestamp'] as string | undefined;
    const nonceHeader = req.headers['x-signature-nonce'] as string | undefined;
    if (!sig || typeof sig !== 'string' || !tsStr || typeof tsStr !== 'string') {
      logWarn('invalid signature attempt: missing X-Signature or X-Signature-Timestamp');
      sendError(res, 'SIGNATURE_MALFORMED', 'Missing X-Signature or X-Signature-Timestamp');
      return;
    }
    const nonce = typeof nonceHeader === 'string' ? nonceHeader.trim() : '';
    if (!nonce) {
      logWarn('invalid signature attempt: missing X-Signature-Nonce');
      sendError(res, 'SIGNATURE_MALFORMED', 'Missing X-Signature-Nonce');
      return;
    }

    const timestamp = parseInt(tsStr, 10);
    if (Number.isNaN(timestamp) || timestamp <= 0) {
      logWarn('invalid signature attempt: invalid timestamp');
      sendError(res, 'SIGNATURE_MALFORMED', 'Invalid X-Signature-Timestamp');
      return;
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > signatureMaxAgeMs) {
      logWarn('invalid signature attempt: signature expired');
      sendError(res, 'SIGNATURE_EXPIRED', 'Signature timestamp expired');
      return;
    }

    // Step Security.10: sessionId from auth context (placeholder if not in JWT)
    const sessionId = (req.user as { sessionId?: string; jti?: string })?.sessionId
      ?? (req.user as { sessionId?: string; jti?: string })?.jti
      ?? '';
    if (!sessionId) {
      logWarn('sessionId not in auth context; using empty placeholder');
    }

    const rows = await db
      .select({ publicKey: userSecurity.publicKey })
      .from(userSecurity)
      .where(eq(userSecurity.userId, userId))
      .limit(1);
    const publicKey = rows[0]?.publicKey;
    if (!publicKey || typeof publicKey !== 'string') {
      logWarn('invalid signature attempt: user has no public key');
      sendError(res, 'MISSING_PUBLIC_KEY', 'No wallet public key registered');
      return;
    }

    // Step Security.10: look up device by (userId, deviceId) — no auto-register
    const deviceRows = await db
      .select({ id: userDevices.id, revokedAt: userDevices.revokedAt, lastNonce: userDevices.lastNonce })
      .from(userDevices)
      .where(and(eq(userDevices.userId, userId), eq(userDevices.deviceId, deviceId)))
      .limit(1);

    const device = deviceRows[0];
    if (!device) {
      logWarn(`device not found for userId=${userId}, deviceId=${deviceId}`);
      sendError(res, 'DEVICE_NOT_FOUND', 'Device not found');
      return;
    }
    if (device.revokedAt) {
      logWarn(`operation from revoked deviceId=${deviceId}, userId=${userId}`);
      sendError(res, 'DEVICE_REVOKED', 'Device has been revoked', 403);
      return;
    }

    const payload = (req.body && typeof req.body === 'object') ? req.body as Record<string, unknown> : {};
    const message = buildCanonicalMessage(operation, userId, timestamp, nonce, deviceId, sessionId, payload);
    const valid = await verifyEd25519(message, sig, publicKey);
    if (!valid) {
      logWarn('invalid signature attempt');
      sendError(res, 'INVALID_SIGNATURE', 'Invalid signature');
      return;
    }

    // Step Security.10: per-device atomic nonce update
    const updateResult = await db
      .update(userDevices)
      .set({ lastNonce: nonce, lastSeenAt: new Date() })
      .where(
        and(
          eq(userDevices.userId, userId),
          eq(userDevices.deviceId, deviceId),
          or(isNull(userDevices.lastNonce), ne(userDevices.lastNonce, nonce))
        )
      )
      .returning({ id: userDevices.id });

    if (updateResult.length === 0) {
      logWarn(`replay detected for userId=${userId}, deviceId=${deviceId}, nonce=${nonce}`);
      sendError(res, 'REPLAY_DETECTED', 'Nonce already used');
      return;
    }

    logInfo(`nonce accepted for userId=${userId}, deviceId=${deviceId}, nonce=${nonce}`);
    logInfo(`signature verified for userId=${userId}`);
    logAudit('SIGNATURE_VERIFIED', { operation, deviceId }, userId, deviceId);
    next();
  };
}
