/**
 * Encryption service for 2FA (Step Security.2).
 * AES-256-GCM encryption for TOTP secrets.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { securityEncryptionKey } from '../config/security.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

function deriveKey(salt: Buffer): Buffer {
  let key = securityEncryptionKey;
  if (!key || key.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SECURITY_ENCRYPTION_KEY must be at least 32 chars for AES-256');
    }
    key = 'dev-only-key-do-not-use-in-production-32chars';
  }
  return scryptSync(key, salt, KEY_LENGTH);
}

/**
 * Encrypt plaintext. Returns base64-encoded salt:iv:ciphertext:tag.
 */
export function encrypt(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(salt);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, encrypted, tag]).toString('base64');
}

/**
 * Decrypt ciphertext. Input is base64-encoded salt:iv:ciphertext:tag.
 */
export function decrypt(encryptedBase64: string): string {
  const buf = Buffer.from(encryptedBase64, 'base64');
  const salt = buf.subarray(0, SALT_LENGTH);
  const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const encrypted = buf.subarray(
    SALT_LENGTH + IV_LENGTH,
    buf.length - TAG_LENGTH
  );
  const key = deriveKey(salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}
