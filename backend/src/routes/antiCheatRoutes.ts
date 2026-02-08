// Anti-cheat routes (Step 25) — admin and inspection
import { Router } from 'express';
import { antiCheatService } from '../services/antiCheatService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** GET /anti-cheat/suspicious — List suspicious events — requires auth (admin in production) */
router.get('/suspicious', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const severity = req.query.severity as 'low' | 'medium' | 'high' | undefined;
    const events = await antiCheatService.listSuspiciousEvents({ userId, severity });
    res.json({ success: true, events });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list suspicious events';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /anti-cheat/user/:userId — Get user anti-cheat summary — requires auth */
router.get('/user/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const summary = await antiCheatService.getUserAntiCheatSummary(req.params.userId);
    res.json({ success: true, summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get user summary';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /anti-cheat/tournament/:id/status — Check if tournament has flagged participants */
router.get('/tournament/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { tournamentService } = await import('../services/tournamentService.js');
    const t = await tournamentService.getTournamentWithDetails(req.params.id);
    if (!t) return res.status(404).json({ success: false, error: 'Tournament not found' });
    const participantIds = t.participants.map((p) => p.userId);
    const underReview = await antiCheatService.isTournamentUnderReview(participantIds);
    res.json({ success: true, underReview });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get tournament status';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /anti-cheat/match/:matchId/status — Check if match is under review */
router.get('/match/:matchId/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const underReview = await antiCheatService.isMatchUnderReview(req.params.matchId);
    res.json({ success: true, underReview });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get match status';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /anti-cheat/me — Current user reputation — requires auth */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const reputation = await antiCheatService.calculateReputation(userId);
    const hasSuspicious = await antiCheatService.hasHighSeverityForUser(userId);
    res.json({ success: true, reputation, hasSuspicious });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get reputation';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
