import { Router } from 'express';
import { tournamentService } from '../services/tournamentService.js';
import { tournamentProgressionService } from '../services/tournamentProgressionService.js';
import { authenticate, requirePremium, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** POST /tournaments/matches/:matchId/report-winner — Game engine reports winner (must be before :id) */
router.post('/matches/:matchId/report-winner', authenticate, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body ?? {};
    if (!winnerId || typeof winnerId !== 'string') {
      return res.status(400).json({ success: false, error: 'winnerId is required' });
    }
    const result = await tournamentProgressionService.reportWinner(matchId, winnerId);
    res.json({ success: true, match: result.match, tournamentFinished: result.tournamentFinished ?? false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to report winner';
    res.status(400).json({ success: false, error: message });
  }
});

/** GET /tournaments/matches/:matchId — Get single match */
router.get('/matches/:matchId', authenticate, async (req, res) => {
  try {
    const match = await tournamentProgressionService.getMatch(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });
    res.json({ success: true, match });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get match';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /tournaments — Create tournament (Premium only) */
router.post(
  '/',
  authenticate,
  requirePremium((id) => tournamentService.userIsPremium(id)),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { name, maxPlayers, entryFee, ruleset, isPrivate } = req.body ?? {};
      const t = await tournamentService.createTournament(userId, {
        name: String(name ?? '').trim() || 'Untitled Tournament',
        maxPlayers: [2, 4, 6, 8].includes(Number(maxPlayers)) ? (maxPlayers as 2 | 4 | 6 | 8) : 4,
        entryFee: Math.max(0, Number(entryFee) || 0),
        ruleset: {
          allowJokers: ruleset?.allowJokers !== false,
          tilesPerPlayer: Number(ruleset?.tilesPerPlayer) || 14,
          turnTimeSeconds: Number(ruleset?.turnTimeSeconds) || 60,
          maxPlayers: Number(ruleset?.maxPlayers) || 4,
          customName: ruleset?.customName,
        },
        isPrivate: Boolean(isPrivate),
      });
      res.status(201).json({ success: true, tournament: t });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create tournament';
      res.status(400).json({ success: false, error: message });
    }
  }
);

/** GET /tournaments — List open tournaments */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, freeOnly, premiumOnly } = req.query ?? {};
    const tournaments = await tournamentService.listTournaments({
      status: typeof status === 'string' ? status : undefined,
      freeOnly: freeOnly === 'true' || freeOnly === '1',
      premiumOnly: premiumOnly === 'true' || premiumOnly === '1',
    });
    res.json({ success: true, tournaments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list tournaments';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /tournaments/:id — Tournament details + participants + rules */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const t = await tournamentService.getTournamentWithDetails(req.params.id);
    if (!t) return res.status(404).json({ success: false, error: 'Tournament not found' });
    res.json({ success: true, tournament: t });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get tournament';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /tournaments/:id/join — Join tournament (deduct entry fee) */
router.post('/:id/join', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const t = await tournamentService.joinTournament(req.params.id, userId);
    res.json({ success: true, tournament: t });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to join tournament';
    res.status(400).json({ success: false, error: message });
  }
});

/** POST /tournaments/:id/start — Start tournament (creator only) */
router.post('/:id/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const t = await tournamentService.startTournament(req.params.id, userId);
    res.json({ success: true, tournament: t });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start tournament';
    res.status(400).json({ success: false, error: message });
  }
});

/** POST /tournaments/:id/finish — Finish tournament (creator only, manual for now) */
router.post('/:id/finish', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { winnerUserId } = req.body ?? {};
    const t = await tournamentService.finishTournament(req.params.id, userId, winnerUserId);
    res.json({ success: true, tournament: t });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to finish tournament';
    res.status(400).json({ success: false, error: message });
  }
});

/** GET /tournaments/:id/matches — List matches */
router.get('/:id/matches', authenticate, async (req, res) => {
  try {
    const matches = await tournamentProgressionService.getMatchesForTournament(req.params.id);
    res.json({ success: true, matches });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list matches';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /tournaments/:id/rounds — List rounds with matches */
router.get('/:id/rounds', authenticate, async (req, res) => {
  try {
    const rounds = await tournamentProgressionService.getRoundsForTournament(req.params.id);
    res.json({ success: true, rounds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list rounds';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /tournaments/:id/chat — Fetch chat messages */
router.get('/:id/chat', authenticate, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const messages = await tournamentService.getChatMessages(req.params.id, limit);
    res.json({ success: true, messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch chat';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /tournaments/:id/chat — Send chat message */
router.post('/:id/chat', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { message } = req.body ?? {};
    const msg = await tournamentService.sendChatMessage(req.params.id, userId, String(message ?? ''));
    res.status(201).json({ success: true, message: msg });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send message';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
