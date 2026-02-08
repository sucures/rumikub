// Rumi Wallet routes (Step 34) — validation, rate limit, error mapping, controller
import { Router, type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { verifyClientSignature } from '../middleware/verifyClientSignature.js';
import { require2FAForWalletOps } from '../middleware/require2FA.js';
import { walletRateLimit } from '../middleware/walletRateLimit.js';
import { spendSchema, transferSchema, simulatePaymentSchema } from '../validation/walletValidation.js';
import { qrParseBodySchema } from '../validation/qrValidation.js';
import { mapWalletError } from '../utils/walletErrorMapper.js';
import * as walletController from '../controllers/walletController.js';

const router = Router();

type ZodSchema = typeof spendSchema | typeof transferSchema | typeof simulatePaymentSchema | typeof qrParseBodySchema;

/** Validates req.body with schema; sends 400 on ZodError, otherwise assigns parsed body and next(). */
function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = req.body ?? {};
      // Coerce amount from string for JSON clients
      if (raw.amount !== undefined) raw.amount = Number(raw.amount);
      req.body = schema.parse(raw);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const msg = err.errors[0]?.message ?? 'Validation failed';
        return res.status(400).json({ success: false, error: msg, code: 'VALIDATION_ERROR' });
      }
      next(err);
    }
  };
}

/** Wallet error handler: map to status + body, send { success: false, ...body }. */
function walletErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const { statusCode, body } = mapWalletError(err);
  res.status(statusCode).json({ success: false, ...body });
}

// Read-only: no rate limit
router.get('/balance', authenticate, walletController.getBalance);
router.get('/status', authenticate, walletController.getWalletStatus);
router.get('/transactions', authenticate, walletController.getTransactions);

// RUMI ONE (R1) SPL token on Solana
router.get('/r1/balance', authenticate, walletController.getR1BalanceHandler);
router.post('/r1/broadcast', authenticate, walletRateLimit, walletController.broadcastR1Transfer);

// Step Security.3: QR Wallet Codes
router.get('/qr', authenticate, walletController.getQrPayload);
router.post('/qr/parse', (req, res, next) => {
  try {
    const raw = req.body ?? {};
    req.body = qrParseBodySchema.parse(raw);
    next();
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid QR payload', code: 'INVALID_QR_PAYLOAD' });
    }
    next(err);
  }
}, walletController.parseQrPayloadHandler);

// Write: verifyClientSignature, require2FA (if enabled), rate limit + validation + controller
router.post(
  '/spend',
  authenticate,
  verifyClientSignature('spend'),
  require2FAForWalletOps('spend'),
  walletRateLimit,
  validateBody(spendSchema),
  walletController.spend
);
router.post(
  '/transfer',
  authenticate,
  verifyClientSignature('transfer'),
  require2FAForWalletOps('transfer'),
  walletRateLimit,
  validateBody(transferSchema),
  walletController.transfer
);
router.post(
  '/simulate-payment',
  authenticate,
  verifyClientSignature('simulate-payment'),
  require2FAForWalletOps('simulate-payment'),
  walletRateLimit,
  validateBody(simulatePaymentSchema),
  walletController.simulatePayment
);

router.use(walletErrorHandler);

export default router;
