import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import {
  getWalletBalance,
  getWalletTransactions,
  spendTokens,
  transferTokens,
} from '../services/walletService.js';
import { simulateCardPayment } from '../services/cardSimulationService.js';
import {
  getR1TokenMetadata,
  getR1Balance,
  broadcastSignedTransaction,
} from '../services/solanaR1Service.js';
import type { SpendInput, TransferInput, SimulatePaymentInput } from '../validation/walletValidation.js';
import { ZodError } from 'zod';
import { buildQrPayload, parseQrPayload } from '../validation/qrValidation.js';

function limitOffset(req: AuthRequest) {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
  const offset = Math.max(0, parseInt(String(req.query.offset), 10) || 0);
  return { limit, offset };
}

export async function getBalance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const balance = await getWalletBalance(userId);
    const r1Token = getR1TokenMetadata();
    res.json({ success: true, balance, r1Token: r1Token ?? undefined });
  } catch (err: any) {
    next(err);
  }
}

/** Wallet status: in-app balance + R1 token metadata for Phantom/Solflare/Backpack. */
export async function getWalletStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const balance = await getWalletBalance(userId);
    const r1Token = getR1TokenMetadata();
    res.json({
      success: true,
      balance,
      r1Token: r1Token ?? undefined,
    });
  } catch (err: any) {
    next(err);
  }
}

/** R1 balance for a Solana wallet address (query: address). */
export async function getR1BalanceHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const address = typeof req.query?.address === 'string' ? req.query.address.trim() : '';
    if (!address) {
      res.status(400).json({ success: false, error: 'address is required', code: 'ADDRESS_REQUIRED' });
      return;
    }
    const result = await getR1Balance(address);
    if (!result) {
      res.status(503).json({ success: false, error: 'R1 token not configured', code: 'R1_NOT_CONFIGURED' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (err: any) {
    next(err);
  }
}

/** Broadcast client-signed R1 transfer transaction. */
export async function broadcastR1Transfer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const signedTransaction = typeof req.body?.signedTransaction === 'string'
      ? req.body.signedTransaction.trim()
      : '';
    if (!signedTransaction) {
      res.status(400).json({ success: false, error: 'signedTransaction is required', code: 'SIGNED_TX_REQUIRED' });
      return;
    }
    const { signature } = await broadcastSignedTransaction(signedTransaction);
    res.json({ success: true, signature });
  } catch (err: any) {
    next(err);
  }
}

export async function getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { limit, offset } = limitOffset(req);
    const transactions = await getWalletTransactions(userId, limit, offset);
    res.json({ success: true, transactions });
  } catch (err: any) {
    next(err);
  }
}

export async function spend(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const body = req.body as SpendInput;
    const { balance, transactionId } = await spendTokens(userId, body.amount, body.metadata);
    res.json({ success: true, balance, transactionId });
  } catch (err: any) {
    next(err);
  }
}

export async function transfer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const fromUserId = req.userId!;
    const body = req.body as TransferInput;
    const { fromBalance, toBalance, transactionId } = await transferTokens(
      fromUserId,
      body.toUserId,
      body.amount,
      body.metadata
    );
    res.json({ success: true, balance: fromBalance, toBalance, transactionId });
  } catch (err: any) {
    next(err);
  }
}

export async function simulatePayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const body = req.body as SimulatePaymentInput;
    const result = await simulateCardPayment(userId, body.amount, body.merchantName);
    res.json({ ...result, success: true });
  } catch (err: any) {
    next(err);
  }
}

// Step Security.3: QR Wallet Codes
const LOG_PREFIX = '[qr]';

export async function getQrPayload(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const address = userId; // userId is canonical address for Rumi Wallet (no separate publicKey yet)
    const result = buildQrPayload(address, userId);
    console.info(`${LOG_PREFIX} QR payload generated for userId=${userId}`);
    res.json({ success: true, ...result });
  } catch (err: any) {
    next(err);
  }
}

export async function parseQrPayloadHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const payload = (req.body as { payload?: string })?.payload ?? '';
    const { address, userId } = parseQrPayload(payload);
    res.json({ success: true, address, userId });
  } catch (err: any) {
    console.warn(`${LOG_PREFIX} Invalid QR payload parse attempt`, err instanceof Error ? err.message : err);
    if (err instanceof SyntaxError || err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR payload',
        code: 'INVALID_QR_PAYLOAD',
      });
    }
    console.error(`${LOG_PREFIX} QR parse unexpected error:`, err instanceof Error ? err.message : err);
    next(err);
  }
}
