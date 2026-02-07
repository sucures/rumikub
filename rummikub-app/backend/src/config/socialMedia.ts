// Configuración de Redes Sociales
import axios from 'axios';

export interface SocialMediaConfig {
  youtube: {
    channelId: string;
    apiKey: string;
    enabled: boolean;
  };
  telegram: {
    botToken: string;
    channelId: string;
    groupId: string;
    enabled: boolean;
  };
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
    enabled: boolean;
  };
  instagram: {
    apiKey: string;
    accessToken: string;
    enabled: boolean;
  };
}

const config: SocialMediaConfig = {
  youtube: {
    channelId: process.env.YOUTUBE_CHANNEL_ID || '',
    apiKey: process.env.YOUTUBE_API_KEY || '',
    enabled: process.env.YOUTUBE_ENABLED === 'true',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    channelId: process.env.TELEGRAM_CHANNEL_ID || '',
    groupId: process.env.TELEGRAM_GROUP_ID || '',
    enabled: process.env.TELEGRAM_ENABLED === 'true',
  },
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
    enabled: process.env.TWITTER_ENABLED === 'true',
  },
  instagram: {
    apiKey: process.env.INSTAGRAM_API_KEY || '',
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    enabled: process.env.INSTAGRAM_ENABLED === 'true',
  },
};

// YouTube Integration
export class YouTubeService {
  private apiKey: string;
  private channelId: string;

  constructor() {
    this.apiKey = config.youtube.apiKey;
    this.channelId = config.youtube.channelId;
  }

  async getChannelVideos(maxResults = 10) {
    if (!config.youtube.enabled) return [];

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            key: this.apiKey,
            channelId: this.channelId,
            part: 'snippet',
            type: 'video',
            maxResults,
            order: 'date',
          },
        }
      );

      return response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        url: `https://youtube.com/watch?v=${item.id.videoId}`,
      }));
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      return [];
    }
  }

  async getVideoStats(videoId: string) {
    if (!config.youtube.enabled) return null;

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            key: this.apiKey,
            id: videoId,
            part: 'statistics,snippet',
          },
        }
      );

      if (response.data.items.length === 0) return null;

      const video = response.data.items[0];
      return {
        views: parseInt(video.statistics.viewCount) || 0,
        likes: parseInt(video.statistics.likeCount) || 0,
        comments: parseInt(video.statistics.commentCount) || 0,
      };
    } catch (error) {
      console.error('Error fetching video stats:', error);
      return null;
    }
  }
}

// Telegram Integration
export class TelegramService {
  private botToken: string;
  private channelId: string;
  private groupId: string;

  constructor() {
    this.botToken = config.telegram.botToken;
    this.channelId = config.telegram.channelId;
    this.groupId = config.telegram.groupId;
  }

  async sendMessage(chatId: string, message: string, options?: any) {
    if (!config.telegram.enabled) return;

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          ...options,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  async sendToChannel(message: string) {
    return this.sendMessage(this.channelId, message);
  }

  async sendToGroup(message: string) {
    return this.sendMessage(this.groupId, message);
  }

  async getChannelMembers() {
    if (!config.telegram.enabled) return [];

    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${this.botToken}/getChatMembersCount`,
        {
          params: { chat_id: this.channelId },
        }
      );
      return response.data.result || 0;
    } catch (error) {
      console.error('Error getting channel members:', error);
      return 0;
    }
  }
}

// Twitter/X Integration
export class TwitterService {
  async postTweet(text: string, mediaUrl?: string) {
    if (!config.twitter.enabled) return;

    // Implementación con Twitter API v2
    // Necesitarás usar una librería como twitter-api-v2
    console.log('Posting to Twitter:', text);
    // TODO: Implementar con twitter-api-v2 o similar
  }

  async getMentions() {
    if (!config.twitter.enabled) return [];

    // TODO: Implementar
    return [];
  }
}

// Instagram Integration
export class InstagramService {
  async postPhoto(imageUrl: string, caption: string) {
    if (!config.instagram.enabled) return;

    // Implementación con Instagram Graph API
    console.log('Posting to Instagram:', caption);
    // TODO: Implementar con Instagram Graph API
  }
}

export const youtubeService = new YouTubeService();
export const telegramService = new TelegramService();
export const twitterService = new TwitterService();
export const instagramService = new InstagramService();
