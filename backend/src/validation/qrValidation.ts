/**
 * QR Wallet payload validation (Step Security.3).
 * Standard Rumi Wallet QR format: Option A.
 */
import { z } from 'zod';

const QR_TYPE = 'rumi-wallet-address' as const;
const QR_VERSION = 1;

export const qrPayloadSchema = z.object({
  type: z.literal(QR_TYPE),
  address: z.string().min(1, 'address required'),
  userId: z.string().min(1, 'userId required'),
  version: z.literal(QR_VERSION),
});

export type QrPayload = z.infer<typeof qrPayloadSchema>;

export interface QrPayloadData {
  payload: string;
  address: string;
  userId: string;
}

/**
 * Build a QR payload object for encoding.
 */
export function buildQrPayload(address: string, userId: string): QrPayloadData {
  const obj: QrPayload = { type: QR_TYPE, address, userId, version: QR_VERSION };
  const payload = JSON.stringify(obj);
  return { payload, address, userId };
}

/** Body for POST /qr/parse: payload string. */
export const qrParseBodySchema = z.object({
  payload: z.string().min(1, 'payload required'),
});

export type QrParseBody = z.infer<typeof qrParseBodySchema>;

/**
 * Parse and validate a QR payload string.
 * @returns Parsed { address, userId } or throws ZodError.
 */
export function parseQrPayload(payload: string): { address: string; userId: string } {
  const raw = JSON.parse(payload) as unknown;
  const parsed = qrPayloadSchema.parse(raw);
  return { address: parsed.address, userId: parsed.userId };
}
