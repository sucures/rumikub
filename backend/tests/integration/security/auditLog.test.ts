/**
 * Integration tests for audit log (Step Security.10).
 * Produces example audit_log entries for local testing.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
const testDbUrl = process.env.DATABASE_URL_TEST ?? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (testDbUrl) process.env.DATABASE_URL = testDbUrl;

import { db } from '../../../src/db/index.js';
import { auditLog } from '../../../src/db/schema.js';
import { logAudit } from '../../../src/services/auditService.js';
import { eq, desc } from 'drizzle-orm';

describe('Audit Log (Step Security.10)', () => {
  beforeAll(async () => {
    // Ensure audit_log table exists
  });

  afterEach(async () => {
    await db.delete(auditLog);
  });

  it('logs SIGNATURE_VERIFIED event', async () => {
    await logAudit('SIGNATURE_VERIFIED', { operation: 'spend', deviceId: 'dev-001' }, 'user-1', 'dev-001');
    const rows = await db.select().from(auditLog).where(eq(auditLog.eventType, 'SIGNATURE_VERIFIED'));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: 'user-1',
      deviceId: 'dev-001',
      eventType: 'SIGNATURE_VERIFIED',
      metadata: { operation: 'spend', deviceId: 'dev-001' },
    });
  });

  it('logs RECOVERY_REQUEST event', async () => {
    await logAudit('RECOVERY_REQUEST', { ticketId: 'tkt-123', deviceId: 'dev-002' }, 'user-2', 'dev-002');
    const rows = await db.select().from(auditLog).where(eq(auditLog.eventType, 'RECOVERY_REQUEST'));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: 'user-2',
      deviceId: 'dev-002',
      eventType: 'RECOVERY_REQUEST',
      metadata: { ticketId: 'tkt-123', deviceId: 'dev-002' },
    });
  });

  it('logs RECOVERY_APPROVED and RECOVERY_FINALIZED events', async () => {
    await logAudit('RECOVERY_APPROVED', { ticketId: 'tkt-456' }, 'user-3', 'dev-003');
    await logAudit('RECOVERY_FINALIZED', { ticketId: 'tkt-456' }, 'user-3', 'dev-003');

    const rows = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt));
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const eventTypes = rows.map((r) => r.eventType);
    expect(eventTypes).toContain('RECOVERY_APPROVED');
    expect(eventTypes).toContain('RECOVERY_FINALIZED');
  });

  it('produces example audit_log entry shape', async () => {
    await logAudit('DEVICE_REGISTERED', { deviceName: 'iPhone 15' }, 'user-4', 'dev-004');

    const rows = await db.select().from(auditLog).limit(1);
    expect(rows).toHaveLength(1);
    const entry = rows[0];

    // Example audit_log entry structure (as requested)
    expect(entry).toMatchObject({
      id: expect.any(String),
      userId: 'user-4',
      deviceId: 'dev-004',
      eventType: 'DEVICE_REGISTERED',
      metadata: { deviceName: 'iPhone 15' },
    });
    expect(entry.createdAt).toBeInstanceOf(Date);
  });
});
