// Motivation routes (Step 31)
import { Router } from 'express';
import { getTodayMotivation, setUserMotivation } from '../services/motivationService.js';
import { tournamentService } from '../services/tournamentService.js';
import { authenticate, requirePremium, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** GET /today — Get today's motivational phrase for the user */
router.get('/today', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const text = await getTodayMotivation(userId);
    res.json({ success: true, text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get motivation';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /set — Set custom motivational phrase (premium only) */
router.post('/set', authenticate, requirePremium((id) => tournamentService.userIsPremium(id)), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { text } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required and cannot be empty' });
    }
    await setUserMotivation(userId, text);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to set motivation';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
