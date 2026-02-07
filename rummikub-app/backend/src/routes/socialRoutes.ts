import { Router } from 'express';
import { 
  youtubeService, 
  telegramService, 
  twitterService, 
  instagramService 
} from '../config/socialMedia.js';

const router = Router();

// YouTube
router.get('/youtube/videos', async (req, res) => {
  try {
    const videos = await youtubeService.getChannelVideos(10);
    res.json({ success: true, videos });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/youtube/video/:videoId/stats', async (req, res) => {
  try {
    const stats = await youtubeService.getVideoStats(req.params.videoId);
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Telegram
router.post('/telegram/send', async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const result = await telegramService.sendMessage(chatId, message);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/telegram/members', async (req, res) => {
  try {
    const members = await telegramService.getChannelMembers();
    res.json({ success: true, members });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
