/**
 * Audit logging service (Step Security.10).
 */
import { randomUUID } from 'crypto';
import { db } from '../db/index.js';
import { auditLog } from '../db/schema.js';

export type AuditEventType =
  | 'SIGNATURE_VERIFIED'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_REVOKED'
  | 'RECOVERY_REQUEST'
  | 'RECOVERY_APPROVED'
  | 'RECOVERY_FINALIZED'
  | 'HIGH_RISK_OPERATION'
  // Step Security.10 Phase 2
  | 'DEVICE_SESSION_MISMATCH'
  | 'DEVICE_KEY_VERIFIED'
  | 'DEVICE_KEY_INVALID'
  | 'RISK_EVALUATED'
  | 'RECOVERY_APPROVED_HARDENED';

export async function logAudit(
  eventType: AuditEventType,
  metadata?: Record<string, unknown>,
  userId?: string,
  deviceId?: string
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: randomUUID(),
      userId: userId ?? null,
      deviceId: deviceId ?? null,
      eventType,
      metadata: metadata ?? null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[audit] failed to insert:', (err as Error).message);
  }
}
