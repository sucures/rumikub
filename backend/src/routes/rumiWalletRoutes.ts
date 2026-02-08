// Rumi Wallet routes (Step 32)
import { Router } from 'express';
import {
  getWalletBalance,
  getWalletTransactions,
  spendTokens,
  transferTokens,
} from '../services/walletService.js';
import { simulateCardPayment } from '../services/cardSimulationService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** GET /balance — Rumi token balance */
router.get('/balance', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const balance = await getWalletBalance(userId);
    res.json({ success: true, balance });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get balance';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /transactions — Rumi wallet transaction history */
router.get('/transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
    const offset = Math.max(0, parseInt(String(req.query.offset), 10) || 0);
    const transactions = await getWalletTransactions(userId, limit, offset);
    res.json({ success: true, transactions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get transactions';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /spend — Spend Rumi tokens */
router.post('/spend', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, metadata } = req.body ?? {};
    const amt = Math.max(1, Math.floor(Number(amount) || 0));
    if (amt <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be positive' });
    }
    const meta = typeof metadata === 'object' && metadata !== null ? metadata : {};
    const balance = await spendTokens(userId, amt, meta);
    res.json({ success: true, balance });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to spend';
    const status = message === 'Insufficient balance' ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

/** POST /transfer — Transfer Rumi tokens to another user */
router.post('/transfer', authenticate, async (req: AuthRequest, res) => {
  try {
    const fromUserId = req.userId!;
    const { toUserId, amount, metadata } = req.body ?? {};
    if (!toUserId || typeof toUserId !== 'string') {
      return res.status(400).json({ success: false, error: 'toUserId is required' });
    }
    const amt = Math.max(1, Math.floor(Number(amount) || 0));
    if (amt <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be positive' });
    }
    const meta = typeof metadata === 'object' && metadata !== null ? metadata : {};
    const { fromBalance, toBalance } = await transferTokens(fromUserId, toUserId, amt, meta);
    res.json({ success: true, balance: fromBalance, toBalance });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to transfer';
    const status =
      message === 'Insufficient balance' ||
      message === 'Cannot transfer to yourself' ||
      message === 'Recipient not found'
        ? 400
        : 500;
    res.status(status).json({ success: false, error: message });
  }
});

/** POST /simulate-payment — Simulate a card payment */
router.post('/simulate-payment', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { amount, merchantName } = req.body ?? {};
    const amt = Math.max(1, Math.floor(Number(amount) || 0));
    if (amt <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be positive' });
    }
    const merchant = String(merchantName ?? 'Unknown').slice(0, 100);
    const result = await simulateCardPayment(userId, amt, merchant);
    res.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to simulate payment';
    const status = message === 'Insufficient balance' ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

export default router;
