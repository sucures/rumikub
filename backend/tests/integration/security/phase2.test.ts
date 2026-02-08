/**
 * Integration tests for Step Security.10 Phase 2.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
const testDbUrl = process.env.DATABASE_URL_TEST ?? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (testDbUrl) process.env.DATABASE_URL = testDbUrl;

import { evaluateRisk, type RiskContext } from '../../../src/services/riskEngine.js';
import { buildDeviceAuthMessage } from '../../../src/utils/deviceAuthMessage.js';
import { verifyDeviceKey } from '../../../src/utils/deviceKeyVerification.js';
import type { UserDeviceRow } from '../../../src/db/schema.js';
import { db } from '../../../src/db/index.js';
import { auditLog } from '../../../src/db/schema.js';
import { logAudit } from '../../../src/services/auditService.js';
import { eq, desc } from 'drizzle-orm';

describe('Step Security.10 Phase 2', () => {
  const createMockDevice = (overrides: Partial<UserDeviceRow> = {}): UserDeviceRow =>
    ({
      id: 'dev-1',
      userId: 'user-1',
      deviceId: 'device-a',
      deviceName: null,
      createdAt: new Date(),
      lastSeenAt: new Date(),
      isTrusted: false,
      metadata: {},
      revokedAt: null,
      lastNonce: null,
      deviceKey: null,
      ...overrides,
    }) as UserDeviceRow;

  describe('riskEngine', () => {
    it('new + recovered + high amount → require2FA = true', () => {
      const ctx: RiskContext = {
        userId: 'user-1',
        device: createMockDevice({
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days old
          metadata: { recovered: true, assistedRecovery: true },
          isTrusted: false,
        }),
        operation: 'transfer',
        amount: 50_000,
        hasBackedUpSeed: false,
        isRecovered: true,
        recoveryOpsCount: 2,
        isTrusted: false,
      };
      const result = evaluateRisk(ctx);
      expect(result.require2FA).toBe(true);
      expect(result.factors).toContain('NEW_DEVICE');
      expect(result.factors).toContain('RECOVERED_DEVICE');
      expect(result.factors).toContain('RECENT_RECOVERY');
      expect(result.factors).toContain('HIGH_AMOUNT');
      expect(result.factors).toContain('SEED_NOT_BACKED_UP');
    });

    it('trusted device, low amount, backed-up seed → require2FA = false', () => {
      const ctx: RiskContext = {
        userId: 'user-1',
        device: createMockDevice({
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
          metadata: {},
          isTrusted: true,
        }),
        operation: 'spend',
        amount: 100,
        hasBackedUpSeed: true,
        isRecovered: false,
        isTrusted: true,
      };
      const result = evaluateRisk(ctx);
      expect(result.require2FA).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('deviceAuthMessage', () => {
    it('produces deterministic JSON', () => {
      const msg = buildDeviceAuthMessage('user-1', 'dev-1', 'sess-1', 1700000000000);
      expect(msg).toContain('RUMI_WALLET_DEVICE_V1');
      expect(msg).toContain('device-auth');
      expect(msg).toContain('user-1');
      expect(msg).toContain('dev-1');
      expect(msg).toContain('sess-1');
      expect(msg).toContain('1700000000000');
    });
  });

  describe('deviceKeyVerification', () => {
    it('verifies valid Ed25519 signature', async () => {
      // Use @noble/ed25519 to generate keypair and sign
      const { ed25519 } = await import('@noble/ed25519');
      const priv = ed25519.utils.randomPrivateKey();
      const pub = await ed25519.getPublicKeyAsync(priv);
      const message = buildDeviceAuthMessage('u', 'd', 's', 123);
      const sig = await ed25519.signAsync(Buffer.from(message, 'utf8'), priv);
      const pubB64 = Buffer.from(pub).toString('base64');
      const sigB64 = Buffer.from(sig).toString('base64');
      const valid = await verifyDeviceKey(pubB64, message, sigB64);
      expect(valid).toBe(true);
    });
  });

  describe('audit log', () => {
    afterEach(async () => {
      await db.delete(auditLog);
    });

    it('logs DEVICE_SESSION_MISMATCH', async () => {
      await logAudit('DEVICE_SESSION_MISMATCH', {
        sessionDeviceId: 'dev-a',
        headerDeviceId: 'dev-b',
      }, 'user-1', 'dev-b');
      const rows = await db.select().from(auditLog).where(eq(auditLog.eventType, 'DEVICE_SESSION_MISMATCH'));
      expect(rows).toHaveLength(1);
      expect(rows[0].metadata).toMatchObject({ sessionDeviceId: 'dev-a', headerDeviceId: 'dev-b' });
    });

    it('logs DEVICE_KEY_VERIFIED', async () => {
      await logAudit('DEVICE_KEY_VERIFIED', { deviceId: 'dev-1' }, 'user-1', 'dev-1');
      const rows = await db.select().from(auditLog).where(eq(auditLog.eventType, 'DEVICE_KEY_VERIFIED'));
      expect(rows).toHaveLength(1);
      expect(rows[0].metadata).toMatchObject({ deviceId: 'dev-1' });
    });

    it('logs HIGH_RISK_OPERATION', async () => {
      await logAudit('HIGH_RISK_OPERATION', {
        score: 5,
        factors: ['NEW_DEVICE', 'RECOVERED_DEVICE'],
        operation: 'transfer',
        amount: 15000,
      }, 'user-1', 'dev-1');
      const rows = await db.select().from(auditLog).where(eq(auditLog.eventType, 'HIGH_RISK_OPERATION'));
      expect(rows).toHaveLength(1);
      expect(rows[0].metadata).toMatchObject({
        score: 5,
        factors: ['NEW_DEVICE', 'RECOVERED_DEVICE'],
        operation: 'transfer',
        amount: 15000,
      });
    });
  });
});
