/**
 * Device registration service (Step Security.10 Phase 2).
 */
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userDevices } from '../db/schema.js';
import { logAudit } from './auditService.js';

export interface RegisterDeviceInput {
  userId: string;
  deviceId: string;
  deviceName?: string | null;
  metadata?: Record<string, unknown> | null;
  deviceKey?: string | null;
}

export interface RegisterDeviceResult {
  success: boolean;
  created?: boolean;
}

export async function registerDevice(input: RegisterDeviceInput): Promise<RegisterDeviceResult> {
  const { userId, deviceId, deviceName, metadata, deviceKey } = input;

  const existing = await db
    .select({ id: userDevices.id, deviceKey: userDevices.deviceKey })
    .from(userDevices)
    .where(and(eq(userDevices.userId, userId), eq(userDevices.deviceId, deviceId)))
    .limit(1);

  const now = new Date();

  if (existing.length > 0) {
    const row = existing[0];
    const setPayload: Record<string, unknown> = {
      lastSeenAt: now,
    };
    if (deviceName !== undefined) setPayload.deviceName = deviceName;
    if (metadata !== undefined) setPayload.metadata = metadata;
    if (deviceKey !== undefined && deviceKey !== null && deviceKey !== row.deviceKey) {
      setPayload.deviceKey = deviceKey;
    }
    await db
      .update(userDevices)
      .set(setPayload as Record<string, unknown>)
      .where(eq(userDevices.id, row.id));
    logAudit('DEVICE_REGISTERED', { deviceId, updated: true }, userId, deviceId);
    return { success: true, created: false };
  }

  await db.insert(userDevices).values({
    id: randomUUID(),
    userId,
    deviceId,
    deviceName: deviceName ?? null,
    metadata: metadata ?? null,
    deviceKey: deviceKey ?? null,
    lastSeenAt: now,
  });

  logAudit('DEVICE_REGISTERED', { deviceId, created: true }, userId, deviceId);
  return { success: true, created: true };
}
