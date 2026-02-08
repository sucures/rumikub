import { z } from 'zod';

const optionalMetadataSchema = z
  .record(z.unknown())
  .optional()
  .default({});

/** Body for spend (deduct) endpoint: amount > 0, optional metadata. */
export const spendSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  metadata: optionalMetadataSchema,
});

/** Body for transfer endpoint: toUserId non-empty, amount > 0, optional metadata. */
export const transferSchema = z.object({
  toUserId: z.string().min(1, 'toUserId is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  metadata: optionalMetadataSchema,
});

/** Body for simulate payment: merchantName required, amount > 0. */
export const simulatePaymentSchema = z.object({
  merchantName: z.string().min(1, 'merchantName is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

export type SpendInput = z.infer<typeof spendSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type SimulatePaymentInput = z.infer<typeof simulatePaymentSchema>;
