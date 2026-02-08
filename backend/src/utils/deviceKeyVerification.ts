/**
 * Device key Ed25519 signature verification (Step Security.10 Phase 2).
 */
import { verifyEd25519 } from './signatureVerification.js';

/**
 * Verify Ed25519 signature with device public key.
 * @param deviceKey - base64 or PEM Ed25519 public key
 * @param message - UTF-8 string (device-auth message)
 * @param signature - base64-encoded 64-byte Ed25519 signature
 */
export async function verifyDeviceKey(
  deviceKey: string,
  message: string,
  signature: string
): Promise<boolean> {
  return verifyEd25519(message, signature, deviceKey);
}
