// Marketplace routes (Step 24)
import { Router } from 'express';
import { marketplaceService } from '../services/marketplaceService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** GET /marketplace — List cosmetic items — optional auth (public browse) */
router.get('/', async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const rarity = req.query.rarity as string | undefined;
    const featured = req.query.featured === 'true';
    const items = await marketplaceService.listItems({
      type: type as 'skin' | 'board' | 'tiles' | 'effect' | undefined,
      rarity: rarity as 'common' | 'rare' | 'epic' | 'legendary' | undefined,
      featured: featured || undefined,
    });
    res.json({ success: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list items';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /marketplace/purchase/:itemId — Purchase item — requires auth */
router.post('/purchase/:itemId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const itemId = req.params.itemId;
    const inv = await marketplaceService.purchaseItem(userId, itemId);
    res.json({ success: true, inventoryItem: inv });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Purchase failed';
    res.status(400).json({ success: false, error: message });
  }
});

/** GET /marketplace/:itemId — Item details — optional auth */
router.get('/:itemId', async (req, res) => {
  try {
    const item = await marketplaceService.getItem(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get item';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
