// Profile routes (Step 21)
import { Router } from 'express';
import { profileService } from '../services/profileService.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/** GET /profile/me — Current user profile — requires auth */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const profile = await profileService.getProfile(userId);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get profile';
    res.status(500).json({ success: false, error: message });
  }
});

/** PUT /profile/me — Update profile — requires auth */
router.put('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { username, avatar, avatarUrl, bio, country } = req.body ?? {};
    const profile = await profileService.updateProfile(userId, {
      username,
      avatar,
      avatarUrl,
      bio,
      country,
    });
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    res.status(400).json({ success: false, error: message });
  }
});

/** GET /profile/me/stats — Current user stats — requires auth */
router.get('/me/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const profile = await profileService.getProfile(userId);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    res.json({ success: true, stats: profile.stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get stats';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /profile/:username — Public profile by username */
router.get('/:username', authenticate, async (req, res) => {
  try {
    const profile = await profileService.getPublicProfile(req.params.username);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get profile';
    res.status(500).json({ success: false, error: message });
  }
});

/** GET /profile/:username/stats — Public profile stats */
router.get('/:username/stats', authenticate, async (req, res) => {
  try {
    const profile = await profileService.getPublicProfile(req.params.username);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    res.json({ success: true, stats: profile.stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get stats';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
