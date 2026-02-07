// Configuración de Redes Sociales
import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';

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
  private client: TwitterApi | null = null;

  constructor() {
    if (config.twitter.enabled && config.twitter.apiKey && config.twitter.apiSecret) {
      this.client = new TwitterApi({
        appKey: config.twitter.apiKey,
        appSecret: config.twitter.apiSecret,
        accessToken: config.twitter.accessToken,
        accessSecret: config.twitter.accessTokenSecret,
      });
    }
  }

  async postTweet(text: string, mediaUrl?: string) {
    if (!config.twitter.enabled || !this.client) {
      console.log('Twitter not enabled or not configured');
      return null;
    }

    try {
      // Si hay una imagen, primero subirla
      if (mediaUrl) {
        // Descargar la imagen
        const imageResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);

        // Subir la imagen a Twitter
        const mediaId = await this.client.v1.uploadMedia(imageBuffer, { 
          mimeType: imageResponse.headers['content-type'] 
        });

        // Publicar el tweet con la imagen
        const tweet = await this.client.v2.tweet({
          text,
          media: { media_ids: [mediaId] }
        });

        console.log('Tweet posted successfully with media:', tweet.data.id);
        return tweet.data;
      } else {
        // Publicar el tweet sin imagen
        const tweet = await this.client.v2.tweet(text);
        console.log('Tweet posted successfully:', tweet.data.id);
        return tweet.data;
      }
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      throw error;
    }
  }

  async getMentions() {
    if (!config.twitter.enabled || !this.client) {
      return [];
    }

    try {
      // Obtener el ID del usuario autenticado
      const me = await this.client.v2.me();
      
      // Obtener las menciones del usuario
      const mentions = await this.client.v2.userMentionTimeline(me.data.id, {
        max_results: 10,
        'tweet.fields': ['created_at', 'author_id', 'text'],
      });

      const mentionsList = [];
      for await (const mention of mentions) {
        mentionsList.push({
          id: mention.id,
          text: mention.text,
          authorId: mention.author_id,
          createdAt: mention.created_at,
        });
      }

      return mentionsList;
    } catch (error) {
      console.error('Error getting Twitter mentions:', error);
      return [];
    }
  }
}

// Instagram Integration
export class InstagramService {
  private accessToken: string;
  private apiVersion = 'v18.0';

  constructor() {
    this.accessToken = config.instagram.accessToken;
  }

  async postPhoto(imageUrl: string, caption: string) {
    if (!config.instagram.enabled || !this.accessToken) {
      console.log('Instagram not enabled or not configured');
      return null;
    }

    try {
      // Obtener el Instagram Business Account ID
      const accountResponse = await axios.get(
        `https://graph.facebook.com/${this.apiVersion}/me/accounts`,
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      if (!accountResponse.data.data || accountResponse.data.data.length === 0) {
        throw new Error('No Instagram Business Account found');
      }

      const pageId = accountResponse.data.data[0].id;
      
      // Obtener el Instagram Business Account ID desde la página
      const igAccountResponse = await axios.get(
        `https://graph.facebook.com/${this.apiVersion}/${pageId}`,
        {
          params: {
            fields: 'instagram_business_account',
            access_token: this.accessToken,
          },
        }
      );

      const igAccountId = igAccountResponse.data.instagram_business_account?.id;
      
      if (!igAccountId) {
        throw new Error('Instagram Business Account ID not found');
      }

      // Crear un contenedor de medios (media container)
      const containerResponse = await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${igAccountId}/media`,
        null,
        {
          params: {
            image_url: imageUrl,
            caption: caption,
            access_token: this.accessToken,
          },
        }
      );

      const creationId = containerResponse.data.id;

      // Publicar el contenedor de medios
      const publishResponse = await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${igAccountId}/media_publish`,
        null,
        {
          params: {
            creation_id: creationId,
            access_token: this.accessToken,
          },
        }
      );

      console.log('Photo posted to Instagram successfully:', publishResponse.data.id);
      return publishResponse.data;
    } catch (error) {
      console.error('Error posting to Instagram:', error);
      throw error;
    }
  }
}

export const youtubeService = new YouTubeService();
export const telegramService = new TelegramService();
export const twitterService = new TwitterService();
export const instagramService = new InstagramService();
