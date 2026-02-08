/**
 * Assisted recovery service (Step Security.9 + Security.10 + Phase 2).
 */
import { eq, and, gt, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db/index.js';
import { users, userSecurity, recoveryTickets, userDevices } from '../db/schema.js';
import { generateRecoveryToken, validateRecoveryToken } from '../utils/recoveryToken.js';
import { buildDeviceAuthMessage } from '../utils/deviceAuthMessage.js';
import { verifyDeviceKey } from '../utils/deviceKeyVerification.js';
import {
  recoveryTicketTtl,
  recoveryMaxTicketsPer24h,
} from '../config/security.js';
import { logAudit } from './auditService.js';
import { verify2FACode } from './twoFactorService.js';

const LOG_PREFIX = '[recovery]';

function logInfo(msg: string) {
  console.info(`${LOG_PREFIX} ${msg}`);
}

function logWarn(msg: string) {
  console.warn(`${LOG_PREFIX} ${msg}`);
}

export interface RecoveryRequestResult {
  success: boolean;
  limitReached?: boolean;
}

export async function requestRecovery(
  email: string,
  deviceId: string,
  deviceMetadata?: Record<string, unknown>
): Promise<RecoveryRequestResult> {
  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  const user = userRows[0];
  if (!user) return { success: true };

  // Per-user throttle (Step Security.10): count tickets in last 24h with status != 'CANCELLED'
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ticketRows = await db
    .select({ id: recoveryTickets.id })
    .from(recoveryTickets)
    .where(
      and(
        eq(recoveryTickets.userId, user.id),
        gt(recoveryTickets.createdAt, since),
        ne(recoveryTickets.status, 'CANCELLED')
      )
    )
    .limit(recoveryMaxTicketsPer24h + 1);
  const count = ticketRows.length;
  if (count >= recoveryMaxTicketsPer24h) {
    await db
      .update(userSecurity)
      .set({ recoveryAbuseFlag: true, updatedAt: new Date() })
      .where(eq(userSecurity.userId, user.id));
    logWarn(`recovery limit reached for userId=${user.id}, count=${count}`);
    return { success: false, limitReached: true };
  }

  const { token, randomHex } = generateRecoveryToken();
  const ticketId = randomUUID();
  const expiresAt = new Date(Date.now() + recoveryTicketTtl * 1000);
  await db.insert(recoveryTickets).values({
    id: ticketId,
    userId: user.id,
    deviceId,
    status: 'PENDING',
    method: 'ASSISTED',
    expiresAt,
    approvalToken: randomHex,
    metadata: deviceMetadata ? { deviceMetadata } : null,
  });
  logInfo(`recovery ticket created userId=${user.id} ticketId=${ticketId} method=ASSISTED`);
  logAudit('RECOVERY_REQUEST', { ticketId, deviceId }, user.id, deviceId);

  // TODO: send email with link containing token
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const link = `${frontendUrl}/recovery/approve?token=${encodeURIComponent(token)}`;
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG?.includes('recovery')) {
    console.info(`[recovery] Dev link for userId=${user.id}: ${link}`);
  }

  return { success: true };
}

export interface ApproveRecoveryOptions {
  token: string;
  userId: string;
  deviceId: string;
  sessionId?: string;
  deviceKeySignature?: string | null;
  deviceAuthTimestamp?: number;
  totpCode?: string;
  emailOtp?: string;
  smsOtp?: string;
}

export async function approveRecovery(options: ApproveRecoveryOptions): Promise<{ success: boolean; error?: string; require2FA?: boolean }> {
  const {
    token,
    userId,
    deviceId,
    sessionId = '',
    deviceKeySignature,
    deviceAuthTimestamp = Date.now(),
    totpCode,
    emailOtp,
    smsOtp,
  } = options;

  const randomHex = validateRecoveryToken(token);
  if (!randomHex) {
    logWarn('invalid or expired recovery token');
    return { success: false, error: 'Invalid or expired link' };
  }

  const rows = await db
    .select()
    .from(recoveryTickets)
    .where(eq(recoveryTickets.approvalToken, randomHex))
    .limit(1);
  const ticket = rows[0];
  if (!ticket || ticket.userId !== userId) {
    logWarn('recovery ticket not found or user mismatch');
    return { success: false, error: 'Invalid or expired link' };
  }
  if (ticket.status !== 'PENDING') {
    logWarn('recovery ticket already used or expired');
    return { success: false, error: 'Invalid or expired link' };
  }
  if (ticket.expiresAt < new Date()) {
    await db
      .update(recoveryTickets)
      .set({ status: 'EXPIRED' })
      .where(eq(recoveryTickets.id, ticket.id));
    return { success: false, error: 'Invalid or expired link' };
  }

  if (!deviceId || deviceId !== ticket.deviceId) {
    return { success: false, error: 'Device mismatch' };
  }

  const devRows = await db
    .select()
    .from(userDevices)
    .where(and(eq(userDevices.userId, userId), eq(userDevices.deviceId, deviceId)))
    .limit(1);
  const device = devRows[0];
  if (!device) {
    return { success: false, error: 'Device not found' };
  }

  if (device.deviceKey) {
    const sig = deviceKeySignature?.trim();
    if (!sig) {
      logWarn('device has device_key but X-Device-Key-Signature missing');
      logAudit('DEVICE_KEY_INVALID', { reason: 'missing_signature' }, userId, deviceId);
      return { success: false, error: 'Device key signature required', require2FA: false };
    }
    const message = buildDeviceAuthMessage(userId, deviceId, sessionId, deviceAuthTimestamp);
    const valid = await verifyDeviceKey(device.deviceKey, message, sig);
    if (!valid) {
      logWarn('device key signature invalid');
      logAudit('DEVICE_KEY_INVALID', { reason: 'invalid_signature' }, userId, deviceId);
      return { success: false, error: 'Invalid device key signature', require2FA: false };
    }
    logAudit('DEVICE_KEY_VERIFIED', { deviceId }, userId, deviceId);
  }

  const secRows = await db
    .select({ twoFactorEnabled: userSecurity.twoFactorEnabled })
    .from(userSecurity)
    .where(eq(userSecurity.userId, userId))
    .limit(1);
  const twoFactorEnabled = secRows[0]?.twoFactorEnabled ?? false;
  if (twoFactorEnabled) {
    const valid2FA = await verify2FACode(userId, totpCode, emailOtp, smsOtp);
    if (!valid2FA) {
      return { success: false, error: '2FA required', require2FA: true };
    }
  }

  await db
    .update(recoveryTickets)
    .set({ status: 'USED', usedAt: new Date() })
    .where(eq(recoveryTickets.id, ticket.id));

  const meta = (device.metadata as Record<string, unknown>) ?? {};
  await db
    .insert(userDevices)
    .values({
      id: randomUUID(),
      userId,
      deviceId,
      lastSeenAt: new Date(),
      metadata: { ...meta, recovered: true, assistedRecovery: true },
    })
    .onConflictDoUpdate({
      target: [userDevices.userId, userDevices.deviceId],
      set: {
        lastSeenAt: new Date(),
        metadata: { ...meta, recovered: true, assistedRecovery: true },
      },
    });

  logInfo(`recovery ticket approved userId=${userId} ticketId=${ticket.id} deviceId=${deviceId}`);
  logAudit('RECOVERY_APPROVED_HARDENED', {
    ticketId: ticket.id,
    deviceId,
    hasDeviceKey: !!device.deviceKey,
  }, userId, deviceId);
  return { success: true };
}

export async function finalizeRecovery(
  ticketId: string,
  deviceId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const rows = await db
    .select()
    .from(recoveryTickets)
    .where(eq(recoveryTickets.id, ticketId))
    .limit(1);
  const ticket = rows[0];
  if (!ticket || ticket.userId !== userId) {
    return { success: false, error: 'Invalid or expired ticket' };
  }
  if (ticket.status !== 'USED') {
    return { success: false, error: 'Invalid or expired ticket' };
  }
  if (ticket.deviceId !== deviceId) {
    return { success: false, error: 'Device mismatch' };
  }
  const maxAge = 24 * 60 * 60 * 1000;
  if (ticket.usedAt && Date.now() - ticket.usedAt.getTime() > maxAge) {
    return { success: false, error: 'Ticket expired' };
  }

  const devRows = await db
    .select({ metadata: userDevices.metadata })
    .from(userDevices)
    .where(and(eq(userDevices.userId, userId), eq(userDevices.deviceId, deviceId)))
    .limit(1);
  const meta = (devRows[0]?.metadata as Record<string, unknown>) ?? {};
  await db
    .insert(userDevices)
    .values({
      id: randomUUID(),
      userId,
      deviceId,
      lastSeenAt: new Date(),
      metadata: { ...meta, recovered: true, assistedRecovery: true },
    })
    .onConflictDoUpdate({
      target: [userDevices.userId, userDevices.deviceId],
      set: {
        lastSeenAt: new Date(),
        metadata: { ...meta, recovered: true, assistedRecovery: true },
      },
    });

  logInfo(`recovery finalized userId=${userId} deviceId=${deviceId}`);
  logAudit('RECOVERY_FINALIZED', { ticketId }, userId, deviceId);
  return { success: true };
}
