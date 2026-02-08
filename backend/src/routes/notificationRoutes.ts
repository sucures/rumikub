// Notification routes (Step 26)
import { Router } from 'express';
import { notificationService } from '../services/notificationService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** GET /notifications — list notifications */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === '1';
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const result = await notificationService.listNotifications(userId, { unreadOnly, limit, offset });
    res.json({ success: true, notifications: result.notifications, unreadCount: result.unreadCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list notifications';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /notifications/read/:id — mark as read */
router.post('/read/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const ok = await notificationService.markAsRead(req.params.id, userId);
    if (!ok) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark as read';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /notifications/read-all — mark all as read */
router.post('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark all as read';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
