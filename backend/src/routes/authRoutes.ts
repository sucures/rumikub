import { Router } from 'express';
import { accountService } from '../services/accountService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** POST /api/auth/register — Body: { email, username, password, referredBy? } */
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, referredBy } = req.body ?? {};
    if (!email || typeof email !== 'string' || !username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'email, username and password are required' });
    }
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();
    if (!trimmedEmail || !trimmedUsername || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Invalid email, username or password (min 6 characters)' });
    }
    const result = await accountService.createAccount(trimmedEmail, trimmedUsername, password, referredBy);
    res.status(201).json({ success: true, user: result.user, token: result.token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ success: false, error: message });
  }
});

/** POST /api/auth/login — Body: { email, password } */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }
    const result = await accountService.login(email.trim().toLowerCase(), password);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ success: false, error: message });
  }
});

/** PATCH /api/auth/update — Body: { username?, avatar?, bio? } — requires auth */
router.patch('/update', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { username, avatar, bio } = req.body ?? {};
    const updates: { username?: string; avatar?: string; bio?: string } = {};
    if (typeof username === 'string' && username.trim()) updates.username = username.trim();
    if (typeof avatar === 'string') updates.avatar = avatar;
    if (typeof bio === 'string') updates.bio = bio;
    const user = await accountService.updateProfile(userId, updates);
    res.json({ success: true, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    res.status(400).json({ success: false, error: message });
  }
});

/** GET /api/auth/me — current user (premium, coins, etc.) — requires auth */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await accountService.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get user';
    res.status(500).json({ success: false, error: message });
  }
});

/** POST /api/auth/logout — no body; client should discard token */
router.post('/logout', authenticate, (_req, res) => {
  res.json({ success: true });
});

export default router;
