// Wallet + Store routes (Step 18)
import { Router } from 'express';
import { tokenService } from '../services/tokenService.js';
import { storeService } from '../services/storeService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

/** GET /wallet — Balance + recent transactions */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const [balance, transactions] = await Promise.all([
      tokenService.getBalance(userId),
      tokenService.getTransactions(userId, 20),
    ]);
    res.json({
      success: true,
      wallet: {
        coins: balance.coins,
        gems: balance.gems,
        transactions,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get wallet';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /wallet/spend — Spend coins or gems */
router.post('/spend', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { currency, amount, description } = req.body ?? {};
    if (!currency || !['coins', 'gems'].includes(currency)) {
      return res.status(400).json({ success: false, error: 'currency must be coins or gems' });
    }
    const amt = Math.max(1, Math.floor(Number(amount) || 0));
    if (amt <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be positive' });
    }
    const desc = String(description ?? 'Spend').slice(0, 200);
    const balance =
      currency === 'coins'
        ? await tokenService.spendCoins(userId, amt, desc)
        : await tokenService.spendGems(userId, amt, desc);
    res.json({ success: true, balance });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to spend';
    res.status(400).json({ success: false, error: message });
  }
});

/** POST /wallet/add — Admin only: add coins or gems */
router.post('/add', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    if (!isAdmin(userId)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }
    const { targetUserId, currency, amount, description } = req.body ?? {};
    const targetId = targetUserId ?? userId;
    if (!currency || !['coins', 'gems'].includes(currency)) {
      return res.status(400).json({ success: false, error: 'currency must be coins or gems' });
    }
    const amt = Math.floor(Number(amount) || 0);
    if (amt === 0) {
      return res.status(400).json({ success: false, error: 'amount required' });
    }
    const desc = String(description ?? 'Admin add').slice(0, 200);
    const balance = await tokenService.adminAdd(targetId, currency, amt, desc);
    res.json({ success: true, balance, targetUserId: targetId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
