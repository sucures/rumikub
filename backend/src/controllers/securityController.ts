/**
 * Security controller for 2FA (Step Security.2) and recovery (Step Security.10).
 */
import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import * as twoFactorService from '../services/twoFactorService.js';
import * as recoveryService from '../services/recoveryService.js';
import * as deviceService from '../services/deviceService.js';

export async function getStatus(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const status = await twoFactorService.getSecurityStatus(userId);
  res.json({ success: true, ...status });
}

export async function setupTotp(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const label = typeof req.body?.label === 'string' ? req.body.label : undefined;
  const result = await twoFactorService.setupTotp(userId, label);
  res.json({ success: true, ...result });
}

export async function enableTotp(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  const ok = await twoFactorService.enableTotp(userId, code);
  if (!ok) {
    res.status(400).json({ success: false, error: 'Invalid TOTP code' });
    return;
  }
  res.json({ success: true });
}

export async function disableTotp(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  await twoFactorService.disableTotp(userId);
  res.json({ success: true });
}

export async function sendEmailOtp(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  try {
    await twoFactorService.sendEmailOtp(userId);
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send email OTP';
    res.status(500).json({ success: false, error: msg });
  }
}

export async function verifyEmailOtp(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  const ok = await twoFactorService.verifyEmailOtp(userId, code);
  if (!ok) {
    res.status(400).json({ success: false, error: 'Invalid or expired email OTP' });
    return;
  }
  res.json({ success: true });
}

export async function setPhone(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  if (!phone) {
    res.status(400).json({ success: false, error: 'Phone number is required' });
    return;
  }
  await twoFactorService.setPhoneNumber(userId, phone);
  res.json({ success: true });
}

export async function sendSmsOtp(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  try {
    await twoFactorService.sendSmsOtp(userId);
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send SMS OTP';
    res.status(400).json({ success: false, error: msg });
  }
}

export async function verifySmsOtp(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  const ok = await twoFactorService.verifySmsOtp(userId, code);
  if (!ok) {
    res.status(400).json({ success: false, error: 'Invalid or expired SMS OTP' });
    return;
  }
  res.json({ success: true });
}

export async function disable2FA(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  await twoFactorService.disable2FA(userId);
  res.json({ success: true });
}

// Step Security.10: Recovery endpoints
export async function requestRecovery(req: AuthRequest, res: Response): Promise<void> {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'].trim() : '';

  if (!email) {
    res.status(400).json({ success: false, error: 'Email is required', code: 'EMAIL_REQUIRED' });
    return;
  }
  if (!deviceId) {
    res.status(400).json({ success: false, error: 'X-Device-Id header is required', code: 'DEVICE_ID_REQUIRED' });
    return;
  }

  const result = await recoveryService.requestRecovery(email, deviceId, req.body?.deviceMetadata);

  if (result.limitReached) {
    res.status(429).json({ success: false, error: 'Recovery limit reached', code: 'RECOVERY_LIMIT_REACHED' });
    return;
  }
  res.status(200).json({ success: true });
}

export async function approveRecovery(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const token = typeof req.query?.token === 'string' ? req.query.token.trim() : '';
  if (!token) {
    res.status(400).json({ success: false, error: 'Token is required', code: 'TOKEN_REQUIRED' });
    return;
  }
  const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'].trim() : '';
  if (!deviceId) {
    res.status(400).json({ success: false, error: 'X-Device-Id is required', code: 'DEVICE_ID_REQUIRED' });
    return;
  }

  const sessionId = (req.user as { sessionId?: string; jti?: string })?.sessionId
    ?? (req.user as { sessionId?: string; jti?: string })?.jti
    ?? '';
  const deviceKeySignature = typeof req.headers['x-device-key-signature'] === 'string'
    ? req.headers['x-device-key-signature']
    : undefined;
  const tsStr = req.headers['x-device-auth-timestamp'];
  const deviceAuthTimestamp = typeof tsStr === 'string' ? parseInt(tsStr, 10) : Date.now();
  const totpCode = req.headers['x-2fa-code'] as string | undefined;
  const emailOtp = req.headers['x-email-otp'] as string | undefined;
  const smsOtp = req.headers['x-sms-otp'] as string | undefined;

  const result = await recoveryService.approveRecovery({
    token,
    userId,
    deviceId,
    sessionId,
    deviceKeySignature,
    deviceAuthTimestamp: Number.isNaN(deviceAuthTimestamp) ? Date.now() : deviceAuthTimestamp,
    totpCode,
    emailOtp,
    smsOtp,
  });
  if (!result.success) {
    const status = result.require2FA ? 403 : 400;
    res.status(status).json({
      success: false,
      error: result.error,
      code: result.require2FA ? 'TWO_FACTOR_REQUIRED' : 'APPROVE_FAILED',
    });
    return;
  }
  res.status(200).json({ success: true });
}

export async function finalizeRecovery(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const ticketId = typeof req.body?.ticketId === 'string' ? req.body.ticketId.trim() : '';
  const deviceId = typeof req.headers['x-device-id'] === 'string'
    ? req.headers['x-device-id'].trim()
    : (typeof req.body?.deviceId === 'string' ? req.body.deviceId.trim() : '');

  if (!ticketId) {
    res.status(400).json({ success: false, error: 'ticketId is required', code: 'TICKET_ID_REQUIRED' });
    return;
  }
  if (!deviceId) {
    res.status(400).json({ success: false, error: 'X-Device-Id header or deviceId in body is required', code: 'DEVICE_ID_REQUIRED' });
    return;
  }

  const result = await recoveryService.finalizeRecovery(ticketId, deviceId, userId);
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  res.status(200).json({ success: true });
}

/** Step Security.10 Phase 2: Device registration. */
export async function registerDevice(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const deviceId = typeof req.body?.deviceId === 'string' ? req.body.deviceId.trim() : '';
  if (!deviceId) {
    res.status(400).json({ success: false, error: 'deviceId is required', code: 'DEVICE_ID_REQUIRED' });
    return;
  }
  const deviceName = typeof req.body?.deviceName === 'string' ? req.body.deviceName.trim() || null : null;
  const metadata =
    req.body?.metadata && typeof req.body.metadata === 'object' && !Array.isArray(req.body.metadata)
      ? (req.body.metadata as Record<string, unknown>)
      : null;
  const deviceKey = typeof req.body?.deviceKey === 'string' ? req.body.deviceKey.trim() || null : null;

  const result = await deviceService.registerDevice({
    userId,
    deviceId,
    deviceName,
    metadata,
    deviceKey,
  });
  res.status(200).json({ success: true, created: result.created });
}

/** Step Security.4: Register Ed25519 public key for client-signed transactions. */
export async function setPublicKey(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const publicKey = typeof req.body?.publicKey === 'string' ? req.body.publicKey.trim() : '';
  if (!publicKey) {
    res.status(400).json({ success: false, error: 'publicKey is required' });
    return;
  }
  // Accept PEM or base64 raw 32-byte Ed25519 key
  if (!publicKey.includes('-----BEGIN')) {
    const buf = Buffer.from(publicKey, 'base64');
    if (buf.length !== 32) {
      res.status(400).json({ success: false, error: 'publicKey must be PEM or base64-encoded 32-byte Ed25519 key' });
      return;
    }
  }
  await twoFactorService.setPublicKey(userId, publicKey);
  res.json({ success: true });
}
