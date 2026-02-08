// Friends routes (Step 21)
import { Router } from 'express';
import { friendsService } from '../services/friendsService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** POST /friends/request/:targetId — Send friend request — requires auth */
router.post('/request/:targetId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    await friendsService.sendFriendRequest(userId, req.params.targetId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send request';
    res.status(400).json({ success: false, error: message });
  }
});

/** POST /friends/accept/:requestId — Accept friend request — requires auth */
router.post('/accept/:requestId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    await friendsService.acceptFriendRequest(userId, req.params.requestId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to accept request';
    res.status(400).json({ success: false, error: message });
  }
});

/** POST /friends/reject/:requestId — Reject friend request — requires auth */
router.post('/reject/:requestId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    await friendsService.rejectFriendRequest(userId, req.params.requestId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reject request';
    res.status(400).json({ success: false, error: message });
  }
});

/** DELETE /friends/:friendId — Remove friend — requires auth */
router.delete('/:friendId', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    await friendsService.removeFriend(userId, req.params.friendId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove friend';
    res.status(400).json({ success: false, error: message });
  }
});

/** GET /friends — List friends — requires auth */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const list = await friendsService.listFriends(userId);
    res.json({ success: true, friends: list });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list friends';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /friends/requests — Pending requests — requires auth (must be before :id) */
router.get('/requests', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const pending = await friendsService.listPendingRequests(userId);
    const sent = await friendsService.listSentRequests(userId);
    res.json({ success: true, pending, sent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list requests';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
