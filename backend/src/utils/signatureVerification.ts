/**
 * Ed25519 signature verification for wallet ops (Step Security.4).
 * Accepts PEM or base64 raw 32-byte Ed25519 public key.
 */
import { createPublicKey, verify } from 'crypto';
import * as ed25519 from '@noble/ed25519';

/**
 * Verify Ed25519 signature.
 * @param message - UTF-8 string (canonical message)
 * @param signature - Base64-encoded 64-byte Ed25519 signature
 * @param publicKey - PEM string or base64-encoded 32-byte Ed25519 public key
 */
export async function verifyEd25519(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const sig = Buffer.from(signature, 'base64');
    if (sig.length !== 64) return false;
    const msgBytes = Buffer.from(message, 'utf8');

    if (publicKey.includes('-----BEGIN')) {
      const keyObj = createPublicKey(publicKey);
      return verify(null, msgBytes, keyObj, sig);
    }

    const pubBuf = Buffer.from(publicKey, 'base64');
    if (pubBuf.length !== 32) return false;
    return await ed25519.verifyAsync(
      new Uint8Array(sig),
      new Uint8Array(msgBytes),
      new Uint8Array(pubBuf)
    );
  } catch {
    return false;
  }
}
