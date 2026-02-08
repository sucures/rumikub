// Push token routes (Step 26 + Step 28)
import { Router } from 'express';
import { notificationService } from '../services/notificationService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { isValidExpoPushToken, sendExpoPush } from '../utils/expoPush.js';

const router = Router();

/** POST /push/register — save device token (Expo/FCM) */
router.post('/register', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { token, deviceInfo } = req.body ?? {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'token is required' });
    }
    await notificationService.registerPushToken(userId, token, deviceInfo ?? {});
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register push token';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /push/send — send push notification via Expo Push API */
router.post('/send', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token, title, body, data } = req.body ?? {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'token is required' });
    }
    if (!isValidExpoPushToken(token)) {
      console.warn('[push] Invalid Expo push token:', token.substring(0, 30) + '...');
      return res.status(400).json({ success: false, error: 'token must be a valid Expo push token' });
    }
    const titleStr = typeof title === 'string' ? title.trim() : '';
    const bodyStr = typeof body === 'string' ? body.trim() : '';
    if (!titleStr) {
      return res.status(400).json({ success: false, error: 'title is required and must be non-empty' });
    }
    if (!bodyStr) {
      return res.status(400).json({ success: false, error: 'body is required and must be non-empty' });
    }
    const payloadData = data && typeof data === 'object' ? data : {};
    await sendExpoPush(token, titleStr, bodyStr, payloadData);
    console.log('[push] Sent successfully to', token.substring(0, 25) + '...');
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send push notification';
    console.error('[push] Send error:', message);
    if (message === 'DeviceNotRegistered') {
      return res.status(400).json({ success: false, error: 'Device not registered for push notifications' });
    }
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
