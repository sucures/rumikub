import { Router } from 'express';
import { gameRoomService } from '../services/gameRoomService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** Create a new room. Body: name?, settings?, isPrivate?, password? */
router.post('/', authenticate, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { name, settings, isPrivate, password } = req.body ?? {};
    const room = gameRoomService.createRoom(
      userId,
      name ?? '',
      settings ?? {},
      Boolean(isPrivate),
      password
    );
    res.status(201).json({ success: true, room: gameRoomService.getRoomInfo(room) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create room';
    res.status(400).json({ success: false, error: message });
  }
});

/** Join a room by invite code. Body: inviteCode, password? */
router.post('/join', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { inviteCode, password } = req.body ?? {};
    if (!inviteCode || typeof inviteCode !== 'string') {
      return res.status(400).json({ success: false, error: 'inviteCode is required' });
    }
    const room = await gameRoomService.joinRoomByCode(userId, inviteCode.trim(), password);
    res.json({ success: true, room: gameRoomService.getRoomInfo(room) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Join failed';
    res.status(400).json({ success: false, error: message });
  }
});

/** List public rooms (waiting for players). */
router.get('/public', authenticate, (_req, res) => {
  try {
    const rooms = gameRoomService.getPublicRooms();
    res.json({
      success: true,
      rooms: rooms.map((r) => gameRoomService.getRoomInfo(r)),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list rooms';
    res.status(500).json({ success: false, error: message });
  }
});

/** Get room by id. */
router.get('/:id', authenticate, (req, res) => {
  try {
    const room = gameRoomService.getRoom(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, room: gameRoomService.getRoomInfo(room) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get room';
    res.status(500).json({ success: false, error: message });
  }
});

/** Leave room. */
router.post('/:id/leave', authenticate, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const roomId = req.params.id;
    gameRoomService.leaveRoom(userId, roomId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to leave room';
    res.status(400).json({ success: false, error: message });
  }
});

/** Start game (host only). */
router.post('/:id/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const roomId = req.params.id;
    const game = await gameRoomService.startGame(roomId, userId);
    res.json({ success: true, game });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start game';
    res.status(400).json({ success: false, error: message });
  }
});

/** Matchmaking: find or create a public game. Body: gameMode?, maxPlayers? */
router.post('/matchmaking', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { gameMode, maxPlayers } = req.body ?? {};
    const room = await gameRoomService.findPublicGame(userId, { gameMode, maxPlayers });
    if (!room) {
      return res.status(500).json({ success: false, error: 'Matchmaking failed' });
    }
    res.json({ success: true, room: gameRoomService.getRoomInfo(room) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Matchmaking failed';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
