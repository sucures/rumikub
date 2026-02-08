import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { activeGameStore } from '../services/activeGameStore.js';
import { antiCheatService } from '../services/antiCheatService.js';
import type { Player } from '../shared/types.js';

const router = Router();

/** POST /game/:id/log — Log game action (for client-side submission) */
router.post('/:id/log', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const gameId = req.params.id;
    const { actionType, payload, matchId } = req.body ?? {};
    if (!actionType) {
      return res.status(400).json({ success: false, error: 'actionType required' });
    }
    await antiCheatService.logAction(gameId, userId, actionType, payload ?? {}, matchId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to log action';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /game/:id/validate-move — Validate move before applying (optional pre-check) */
router.post('/:id/validate-move', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const gameId = req.params.id;
    const game = activeGameStore.getGame(gameId);
    if (!game) return res.status(404).json({ success: false, error: 'Game not found' });
    const playerIndex = game.players.findIndex((p: Player) => p.userId === userId);
    if (playerIndex < 0) return res.status(403).json({ success: false, error: 'Not in game' });
    const { move } = req.body ?? {};
    if (!move) return res.status(400).json({ success: false, error: 'move required' });
    const result = antiCheatService.validateMove(game, playerIndex, move);
    res.json({ success: result.valid, valid: result.valid, error: result.error });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    res.status(500).json({ success: false, error: message, valid: false });
  }
});

/** Get game state by id (for reload/reconnect). Caller must be a player in the game. */
router.get('/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const gameId = req.params.id;
    const game = activeGameStore.getGame(gameId);

    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const isPlayer = game.players.some((p: Player) => p.userId === userId);
    if (!isPlayer) {
      return res.status(403).json({ success: false, error: 'Not a player in this game' });
    }

    res.json({ success: true, game });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get game';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
