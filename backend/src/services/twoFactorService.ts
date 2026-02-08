/**
 * Two-Factor Authentication service (Step Security.2).
 */
import { eq } from 'drizzle-orm';
import { generateSecret, generate, verify, generateURI } from 'otplib';
import { db } from '../db/index.js';
import { users, userSecurity } from '../db/schema.js';
import type { TwoFactorMethod } from '../db/schema.js';
import { encrypt, decrypt } from '../utils/encryptionService.js';
import { setOtp, consumeOtp } from '../utils/otpCache.js';
import nodemailer from 'nodemailer';

const ISSUER = 'Rumi Wallet';
const OTP_DIGITS = 6;

function genOtpCode(): string {
  const max = Math.pow(10, OTP_DIGITS) - 1;
  const code = Math.floor(Math.random() * (max - Math.pow(10, OTP_DIGITS - 1) + 1) + Math.pow(10, OTP_DIGITS - 1));
  return String(code);
}

export interface SecurityStatus {
  twoFactorEnabled: boolean;
  methods: TwoFactorMethod[];
  emailVerified: boolean;
  phoneVerified: boolean;
}

export async function getSecurityStatus(userId: string): Promise<SecurityStatus | null> {
  const rows = await db
    .select({
      twoFactorEnabled: userSecurity.twoFactorEnabled,
      twoFactorMethods: userSecurity.twoFactorMethods,
      emailVerified: userSecurity.emailVerified,
      phoneVerified: userSecurity.phoneVerified,
    })
    .from(userSecurity)
    .where(eq(userSecurity.userId, userId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return { twoFactorEnabled: false, methods: [], emailVerified: false, phoneVerified: false };
  }
  return {
    twoFactorEnabled: row.twoFactorEnabled,
    methods: (row.twoFactorMethods ?? []) as TwoFactorMethod[],
    emailVerified: row.emailVerified,
    phoneVerified: row.phoneVerified,
  };
}

async function upsertSecurity(userId: string, data: Partial<{ totpSecret: string | null; twoFactorEnabled: boolean; twoFactorMethods: TwoFactorMethod[]; emailVerified: boolean; phoneNumber: string | null; phoneVerified: boolean; publicKey: string | null }>): Promise<void> {
  const existing = await db.select().from(userSecurity).where(eq(userSecurity.userId, userId)).limit(1);
  const now = new Date();
  if (existing.length > 0) {
    await db
      .update(userSecurity)
      .set({ ...data, updatedAt: now } as Record<string, unknown>)
      .where(eq(userSecurity.userId, userId));
  } else {
    await db.insert(userSecurity).values({
      userId,
      twoFactorEnabled: data.twoFactorEnabled ?? false,
      twoFactorMethods: data.twoFactorMethods ?? [],
      totpSecret: data.totpSecret ?? null,
      emailVerified: data.emailVerified ?? false,
      phoneNumber: data.phoneNumber ?? null,
      phoneVerified: data.phoneVerified ?? false,
      publicKey: data.publicKey ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/** Step Security.4: Register Ed25519 public key for client-signed transactions. */
export async function setPublicKey(userId: string, publicKey: string): Promise<void> {
  await upsertSecurity(userId, { publicKey });
}

export interface TotpSetupResult {
  secret: string;
  uri: string;
}

export async function setupTotp(userId: string, label?: string): Promise<TotpSetupResult> {
  const secret = generateSecret();
  const encryptedSecret = encrypt(secret);
  const userRows = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  const userLabel = label ?? userRows[0]?.email ?? userId;
  const uri = generateURI({ issuer: ISSUER, label: userLabel, secret, digits: OTP_DIGITS });
  await upsertSecurity(userId, { totpSecret: encryptedSecret });
  return { secret, uri };
}

export async function enableTotp(userId: string, code: string): Promise<boolean> {
  const rows = await db.select({ totpSecret: userSecurity.totpSecret }).from(userSecurity).where(eq(userSecurity.userId, userId)).limit(1);
  const row = rows[0];
  if (!row?.totpSecret) return false;
  const secret = decrypt(row.totpSecret);
  const isValid = await verify({ secret, token: code });
  if (!isValid) return false;
  const existingRows = await db.select({ twoFactorMethods: userSecurity.twoFactorMethods }).from(userSecurity).where(eq(userSecurity.userId, userId)).limit(1);
  const methods = (existingRows[0]?.twoFactorMethods ?? []) as TwoFactorMethod[];
  if (!methods.includes('totp')) methods.push('totp');
  await upsertSecurity(userId, { twoFactorEnabled: true, twoFactorMethods: methods });
  return true;
}

export async function disableTotp(userId: string): Promise<void> {
  const rows = await db.select({ twoFactorMethods: userSecurity.twoFactorMethods }).from(userSecurity).where(eq(userSecurity.userId, userId)).limit(1);
  const methods = ((rows[0]?.twoFactorMethods ?? []) as TwoFactorMethod[]).filter((m) => m !== 'totp');
  const twoFactorEnabled = methods.length > 0;
  await upsertSecurity(userId, { totpSecret: null, twoFactorEnabled, twoFactorMethods: methods });
}

export async function sendEmailOtp(userId: string): Promise<void> {
  const userRows = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  const email = userRows[0]?.email;
  if (!email) throw new Error('User has no email');
  const code = genOtpCode();
  await setOtp(`email:${userId}`, code);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '25', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } : undefined,
  });
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@rummikub.local',
      to: email,
      subject: 'Rumi Wallet – OTP Code',
      text: `Your verification code is: ${code}\n\nIt expires in 2 minutes.`,
    });
  } catch (err: any) {
    console.warn('[2fa] Email OTP send failed:', (err as Error).message);
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG?.includes('2fa')) {
      console.info(`[2fa] Dev OTP for userId=${userId}: ${code}`);
    }
    throw new Error('Failed to send email OTP');
  }
}

export async function verifyEmailOtp(userId: string, code: string): Promise<boolean> {
  const stored = await consumeOtp(`email:${userId}`);
  if (!stored || stored !== code) return false;
  await upsertSecurity(userId, { emailVerified: true });
  const rows = await db.select({ twoFactorMethods: userSecurity.twoFactorMethods }).from(userSecurity).where(eq(userSecurity.userId, userId)).limit(1);
  const methods = (rows[0]?.twoFactorMethods ?? []) as TwoFactorMethod[];
  if (!methods.includes('email_otp')) methods.push('email_otp');
  await upsertSecurity(userId, { twoFactorEnabled: true, twoFactorMethods: methods });
  return true;
}

export async function sendSmsOtp(userId: string): Promise<void> {
  const rows = await db.select({ phoneNumber: userSecurity.phoneNumber }).from(userSecurity).where(eq(userSecurity.userId, userId)).limit(1);
  const phone = rows[0]?.phoneNumber;
  if (!phone) throw new Error('User has no phone number');
  const code = genOtpCode();
  await setOtp(`sms:${userId}`, code);
  // No SMS provider – log for dev
  console.info(`[2fa] SMS OTP for userId=${userId} phone=${phone}: ${code}`);
}

export async function verifySmsOtp(userId: string, code: string): Promise<boolean> {
  const stored = await consumeOtp(`sms:${userId}`);
  if (!stored || stored !== code) return false;
  await upsertSecurity(userId, { phoneVerified: true });
  const rows = await db.select({ twoFactorMethods: userSecurity.twoFactorMethods }).from(userSecurity).where(eq(userSecurity.userId, userId)).limit(1);
  const methods = (rows[0]?.twoFactorMethods ?? []) as TwoFactorMethod[];
  if (!methods.includes('sms_otp')) methods.push('sms_otp');
  await upsertSecurity(userId, { twoFactorEnabled: true, twoFactorMethods: methods });
  return true;
}

export async function setPhoneNumber(userId: string, phone: string): Promise<void> {
  await upsertSecurity(userId, { phoneNumber: phone });
}

export async function disable2FA(userId: string): Promise<void> {
  await upsertSecurity(userId, {
    twoFactorEnabled: false,
    twoFactorMethods: [],
    totpSecret: null,
    emailVerified: false,
    phoneVerified: false,
  });
}

/** Verify any 2FA code provided in headers (TOTP, email OTP, SMS OTP). */
export async function verify2FACode(
  userId: string,
  totpCode?: string | null,
  emailOtp?: string | null,
  smsOtp?: string | null
): Promise<boolean> {
  const status = await getSecurityStatus(userId);
  if (!status?.twoFactorEnabled || status.methods.length === 0) return true;

  if (status.methods.includes('totp') && totpCode) {
    const rows = await db.select({ totpSecret: userSecurity.totpSecret }).from(userSecurity).where(eq(userSecurity.userId, userId)).limit(1);
    const secret = rows[0]?.totpSecret;
    if (secret) {
      const decrypted = decrypt(secret);
      if (await verify({ secret: decrypted, token: totpCode })) return true;
    }
  }
  if (status.methods.includes('email_otp') && emailOtp) {
    const stored = await consumeOtp(`email:${userId}`);
    if (stored && stored === emailOtp) return true;
  }
  if (status.methods.includes('sms_otp') && smsOtp) {
    const stored = await consumeOtp(`sms:${userId}`);
    if (stored && stored === smsOtp) return true;
  }
  return false;
}
