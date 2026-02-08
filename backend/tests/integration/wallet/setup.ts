/**
 * E2E test setup for Rumi Wallet (Step 35.1).
 * Loads .env.test and provides getTestApp, resetWalletDatabase, createTestUser, getAuthHeader.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.test before any DB-dependent imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
const testDbUrl = process.env.DATABASE_URL_TEST ?? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (testDbUrl) {
  process.env.DATABASE_URL = testDbUrl;
}

import { db } from '../../../src/db/index.js';
import { users } from '../../../src/db/schema.js';

let walletRoutes: express.Router | null = null;

/**
 * Returns Express app with wallet routes mounted at /api/rumi-wallet.
 * Auth middleware must be mocked by tests (e.g. set req.userId from X-Test-User-Id).
 */
export async function getTestApp(): Promise<express.Express> {
  if (!walletRoutes) {
    const mod = await import('../../../src/routes/walletRoutes.js');
    walletRoutes = mod.default;
  }
  const app = express();
  app.use(express.json());
  app.use('/api/rumi-wallet', walletRoutes);
  return app;
}

/**
 * Truncates wallet_transactions and wallet_accounts for a clean slate.
 */
export async function resetWalletDatabase(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE wallet_transactions CASCADE`);
  await db.execute(sql`TRUNCATE TABLE wallet_accounts CASCADE`);
}

/**
 * Creates a test user and returns the user id.
 */
export async function createTestUser(id?: string): Promise<string> {
  const userId = id ?? `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const passwordHash = await bcrypt.hash('testpass123', 10);
  const email = `test_${userId}@test.local`;
  const username = `user_${userId.slice(-6)}`;

  await db
    .insert(users)
    .values({
      id: userId,
      email,
      username,
      passwordHash,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { email, username, passwordHash, updatedAt: new Date() },
    });

  return userId;
}

/**
 * Returns headers for test requests that inject userId via X-Test-User-Id.
 * Tests must mock authenticate to read this header.
 */
export function getAuthHeader(userId: string): Record<string, string> {
  return { 'X-Test-User-Id': userId };
}
