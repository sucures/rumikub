// Inventory routes (Step 24)
import { Router } from 'express';
import { marketplaceService } from '../services/marketplaceService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** GET /inventory — User inventory — requires auth */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const inventory = await marketplaceService.getInventory(userId);
    res.json({ success: true, inventory });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get inventory';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /inventory/loadout — Get equipped items — requires auth */
router.get('/loadout', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const withItems = req.query.withItems === 'true';
    const loadout = withItems
      ? await marketplaceService.getLoadoutWithItems(userId)
      : await marketplaceService.getLoadout(userId);
    res.json({ success: true, loadout });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get loadout';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /inventory/loadout — Set equipped items — requires auth */
router.post('/loadout', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { skinId, boardId, tilesId, effectId } = req.body ?? {};
    const loadout = await marketplaceService.setLoadout(userId, {
      skinId: skinId ?? null,
      boardId: boardId ?? null,
      tilesId: tilesId ?? null,
      effectId: effectId ?? null,
    });
    res.json({ success: true, loadout });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to set loadout';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
