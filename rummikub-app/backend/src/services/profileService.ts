// Servicio de Gestión de Perfiles
import { User, UserStats, Achievement } from '../../../shared/types';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  level: number;
  experience: number;
  stats: UserStats;
  achievements: Achievement[];
  favoriteColor?: string;
  favoriteTileSet?: string;
  country?: string;
  language: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  favoriteColor?: string;
  favoriteTileSet?: string;
  country?: string;
  language?: string;
}

export class ProfileService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  // Obtener perfil de usuario
  async getProfile(userId: string): Promise<UserProfile | null> {
    // const user = await UserModel.findById(userId);
    // if (!user) {
    //   return null;
    // }

    // const profile: UserProfile = {
    //   id: user.id,
    //   userId: user.id,
    //   username: user.username,
    //   displayName: user.displayName,
    //   bio: user.bio,
    //   avatar: user.avatar,
    //   banner: user.banner,
    //   level: user.level,
    //   experience: user.experience,
    //   stats: user.stats,
    //   achievements: user.achievements,
    //   favoriteColor: user.favoriteColor,
    //   favoriteTileSet: user.favoriteTileSet,
    //   country: user.country,
    //   language: user.language || 'es',
    //   createdAt: user.createdAt,
    //   lastUpdated: user.lastUpdated || user.createdAt,
    // };

    // return profile;
    return null;
  }

  // Actualizar perfil
  async updateProfile(
    userId: string,
    updates: ProfileUpdate
  ): Promise<UserProfile> {
    // const user = await UserModel.findById(userId);
    // if (!user) {
    //   throw new Error('Usuario no encontrado');
    // }

    // Validar username único si se cambia
    // if (updates.username && updates.username !== user.username) {
    //   const existing = await UserModel.findOne({
    //     username: updates.username,
    //     id: { $ne: userId },
    //   });
    //   if (existing) {
    //     throw new Error('El nombre de usuario ya está en uso');
    //   }
    // }

    // Actualizar campos
    // const updateData: any = {
    //   lastUpdated: new Date(),
    // };
    // if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    // if (updates.bio !== undefined) updateData.bio = updates.bio;
    // if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    // if (updates.banner !== undefined) updateData.banner = updates.banner;
    // if (updates.favoriteColor !== undefined) updateData.favoriteColor = updates.favoriteColor;
    // if (updates.favoriteTileSet !== undefined) updateData.favoriteTileSet = updates.favoriteTileSet;
    // if (updates.country !== undefined) updateData.country = updates.country;
    // if (updates.language !== undefined) updateData.language = updates.language;

    // await UserModel.updateOne({ id: userId }, { $set: updateData });

    // return await this.getProfile(userId);
    throw new Error('Not implemented');
  }

  // Subir avatar
  async uploadAvatar(userId: string, file: Buffer, mimeType: string): Promise<string> {
    const fileExtension = mimeType.split('/')[1];
    const fileName = `avatars/${userId}/${uuidv4()}.${fileExtension}`;

    // Subir a S3
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'rummikub-uploads',
        Key: fileName,
        Body: file,
        ContentType: mimeType,
        ACL: 'public-read',
      })
    );

    const avatarUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${fileName}`;

    // Actualizar perfil
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $set: { avatar: avatarUrl, lastUpdated: new Date() } }
    // );

    return avatarUrl;
  }

  // Subir banner
  async uploadBanner(userId: string, file: Buffer, mimeType: string): Promise<string> {
    const fileExtension = mimeType.split('/')[1];
    const fileName = `banners/${userId}/${uuidv4()}.${fileExtension}`;

    // Subir a S3
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'rummikub-uploads',
        Key: fileName,
        Body: file,
        ContentType: mimeType,
        ACL: 'public-read',
      })
    );

    const bannerUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${fileName}`;

    // Actualizar perfil
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $set: { banner: bannerUrl, lastUpdated: new Date() } }
    // );

    return bannerUrl;
  }

  // Eliminar avatar
  async deleteAvatar(userId: string): Promise<void> {
    // const user = await UserModel.findById(userId);
    // if (!user || !user.avatar) {
    //   return;
    // }

    // Extraer key del URL
    // const urlParts = user.avatar.split('/');
    // const key = urlParts.slice(-2).join('/');

    // Eliminar de S3
    // await this.s3Client.send(
    //   new DeleteObjectCommand({
    //     Bucket: process.env.S3_BUCKET || 'rummikub-uploads',
    //     Key: key,
    //   })
    // );

    // Actualizar perfil
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $set: { avatar: undefined, lastUpdated: new Date() } }
    // );
  }

  // Buscar perfiles
  async searchProfiles(query: string, limit: number = 20): Promise<UserProfile[]> {
    // const users = await UserModel.find({
    //   $or: [
    //     { username: { $regex: query, $options: 'i' } },
    //     { displayName: { $regex: query, $options: 'i' } },
    //   ],
    //   deletedAt: { $exists: false },
    // })
    //   .limit(limit)
    //   .select('id username displayName avatar level stats');

    // return users.map((user) => ({
    //   id: user.id,
    //   userId: user.id,
    //   username: user.username,
    //   displayName: user.displayName,
    //   avatar: user.avatar,
    //   level: user.level,
    //   stats: user.stats,
    //   achievements: user.achievements,
    //   createdAt: user.createdAt,
    //   lastUpdated: user.lastUpdated || user.createdAt,
    // }));

    return [];
  }

  // Obtener perfiles de amigos
  async getFriendsProfiles(userId: string): Promise<UserProfile[]> {
    // const user = await UserModel.findById(userId);
    // if (!user || !user.friends || user.friends.length === 0) {
    //   return [];
    // }

    // const friends = await UserModel.find({
    //   id: { $in: user.friends },
    // }).select('id username displayName avatar level stats achievements');

    // return friends.map((friend) => ({
    //   id: friend.id,
    //   userId: friend.id,
    //   username: friend.username,
    //   displayName: friend.displayName,
    //   avatar: friend.avatar,
    //   level: friend.level,
    //   stats: friend.stats,
    //   achievements: friend.achievements,
    //   createdAt: friend.createdAt,
    //   lastUpdated: friend.lastUpdated || friend.createdAt,
    // }));

    return [];
  }

  // Verificar si es amigo
  async isFriend(userId: string, otherUserId: string): Promise<boolean> {
    // const user = await UserModel.findById(userId);
    // return user?.friends?.includes(otherUserId) || false;
    return false;
  }
}

export const profileService = new ProfileService();
