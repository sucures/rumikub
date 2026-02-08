// Referral routes (Step 20)
import { Router } from 'express';
import { referralService } from '../services/referralService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();
const BASE_URL = process.env.FRONTEND_URL || process.env.BASE_URL || 'https://rumimind.com';

/** GET /referrals/me — Referral code, link, stats, rewards — requires auth */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const stats = await referralService.getReferralStats(userId, BASE_URL);
    res.json({ success: true, referrals: stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get referral info';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /referrals/leaderboard — Top inviters */
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const leaderboard = await referralService.getLeaderboard(limit);
    res.json({ success: true, leaderboard });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get leaderboard';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /referrals/validate/:code — Validate referral code (public, for invite page) */
router.get('/validate/:code', async (req, res) => {
  try {
    const code = req.params.code?.trim();
    if (!code) return res.status(400).json({ success: false, valid: false });
    const inviterId = await referralService.getReferralCodeByCode(code);
    res.json({ success: true, valid: !!inviterId });
  } catch {
    res.json({ success: false, valid: false });
  }
});

export default router;
