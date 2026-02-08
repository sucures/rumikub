// Store routes (Step 18)
import { Router } from 'express';
import { storeService } from '../services/storeService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** GET /store — List store items */
router.get('/', authenticate, async (_req, res) => {
  try {
    const items = await storeService.listStoreItems();
    res.json({ success: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list store';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /store/purchase/:itemId — Purchase item */
router.post('/purchase/:itemId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const itemId = req.params.itemId;
    const amount = Math.max(1, Math.floor(Number(req.body?.amount) || 1));
    const result = await storeService.purchaseItem(userId, itemId, amount);
    res.json({ ...result, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to purchase';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
