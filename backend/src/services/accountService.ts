// Servicio de Gestión de Cuentas
import { User, UserStats, Achievement } from '../shared/types.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import type { UserRow } from '../db/schema.js';
import { referralService } from './referralService.js';

export interface AccountSettings {
  notifications: {
    gameInvites: boolean;
    tournamentReminders: boolean;
    friendRequests: boolean;
    achievements: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    showStats: boolean;
    allowFriendRequests: boolean;
  };
  gameplay: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    animationsEnabled: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}

export class AccountService {
  // Crear nueva cuenta
  async createAccount(
    email: string,
    username: string,
    password: string,
    referredBy?: string
  ): Promise<{ user: Partial<User>; token: string }> {
    const existingEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      throw new Error('Email already registered');
    }
    const existingUsername = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (existingUsername.length > 0) {
      throw new Error('Username already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = this.generateUserId();
    const defaultStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalScore: 0,
      tournamentsWon: 0,
      longestStreak: 0,
      currentStreak: 0,
      bestRank: 0,
    };

    await db.insert(users).values({
      id,
      email,
      username,
      passwordHash,
      level: 1,
      experience: 0,
      coins: 100,
      rumTokens: 0,
      premium: false,
      stats: defaultStats,
      referredBy: null,
    });

    await referralService.ensureReferralCode(id);
    if (referredBy && typeof referredBy === 'string' && referredBy.trim()) {
      await referralService.assignReferral(id, referredBy.trim());
    }

    const rowsAfter = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const rowAfter = rowsAfter[0];
    if (!rowAfter) throw new Error('User creation failed');
    const user = this.rowToUser(rowAfter);
    return {
      user: this.sanitizeUser(user),
      token: this.generateToken(id),
    };
  }

  // Iniciar sesión
  async login(email: string, password: string): Promise<{ user: Partial<User>; token: string }> {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const row = rows[0];
    if (!row) {
      throw new Error('Invalid credentials');
    }
    const isValid = await bcrypt.compare(password, row.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    const now = new Date();
    await db.update(users).set({ lastLoginAt: now, updatedAt: now }).where(eq(users.id, row.id));
    const user = this.rowToUser({ ...row, lastLoginAt: now });
    return {
      user: this.sanitizeUser(user),
      token: this.generateToken(row.id),
    };
  }

  // Actualizar perfil
  async updateProfile(
    userId: string,
    updates: {
      username?: string;
      avatar?: string;
      bio?: string;
    }
  ): Promise<Partial<User>> {
    if (updates.username !== undefined) {
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, updates.username)).limit(1);
      if (existing.length > 0 && existing[0].id !== userId) {
        throw new Error('Username already in use');
      }
    }
    await db
      .update(users)
      .set({
        ...(updates.username !== undefined && { username: updates.username }),
        ...(updates.avatar !== undefined && { avatar: updates.avatar }),
        ...(updates.bio !== undefined && { bio: updates.bio }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) {
      return {};
    }
    return this.sanitizeUser(this.rowToUser(row));
  }

  // Actualizar configuración de cuenta
  async updateSettings(
    userId: string,
    settings: Partial<AccountSettings>
  ): Promise<AccountSettings> {
    // Guardar configuración
    // await UserSettingsModel.updateOne(
    //   { userId },
    //   { $set: settings },
    //   { upsert: true }
    // );

    // return settings;
    return settings as AccountSettings;
  }

  // Obtener configuración de cuenta
  async getSettings(userId: string): Promise<AccountSettings> {
    // const settings = await UserSettingsModel.findOne({ userId });
    // if (!settings) {
    //   return this.getDefaultSettings();
    // }
    // return settings;

    return this.getDefaultSettings();
  }

  // Cambiar contraseña
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // const user = await UserModel.findById(userId);
    // if (!user) {
    //   throw new Error('Usuario no encontrado');
    // }

    // Verificar contraseña actual
    // const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    // if (!isValid) {
    //   throw new Error('Contraseña actual incorrecta');
    // }

    // Hash nueva contraseña
    // const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $set: { passwordHash: newPasswordHash } }
    // );
  }

  // Eliminar cuenta
  async deleteAccount(userId: string, password: string): Promise<void> {
    // Verificar contraseña
    // const user = await UserModel.findById(userId);
    // const isValid = await bcrypt.compare(password, user.passwordHash);
    // if (!isValid) {
    //   throw new Error('Contraseña incorrecta');
    // }

    // Marcar como eliminado (soft delete)
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $set: { deletedAt: new Date(), email: `deleted_${userId}@deleted.com` } }
    // );
  }

  // Get user by id (for /me endpoint)
  async getUserById(userId: string): Promise<Partial<User> | null> {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.sanitizeUser(this.rowToUser(row));
  }

  // Obtener estadísticas del usuario
  async getUserStats(userId: string): Promise<UserStats> {
    // const user = await UserModel.findById(userId);
    // return user?.stats || this.getDefaultStats();
    return this.getDefaultStats();
  }

  // Agregar logro
  async addAchievement(userId: string, achievement: Achievement): Promise<void> {
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $push: { achievements: achievement } }
    // );

    // Notificar al usuario
    // io.to(`user:${userId}`).emit('achievement-unlocked', achievement);
  }

  // Agregar amigo
  async addFriend(userId: string, friendId: string): Promise<void> {
    // Verificar que no sean ya amigos
    // const user = await UserModel.findById(userId);
    // if (user?.friends.includes(friendId)) {
    //   throw new Error('Ya son amigos');
    // }

    // Agregar a ambos usuarios
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $push: { friends: friendId } }
    // );
    // await UserModel.updateOne(
    //   { id: friendId },
    //   { $push: { friends: userId } }
    // );

    // Notificar
    // io.to(`user:${friendId}`).emit('friend-request-accepted', { userId });
  }

  // Bloquear usuario
  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $push: { blockedUsers: blockedUserId } }
    // );
  }

  // Map DB row to shared User type
  private rowToUser(row: UserRow): User {
    const stats = (row.stats ?? this.getDefaultStats()) as UserStats;
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.passwordHash,
      avatar: row.avatar ?? undefined,
      level: row.level,
      experience: row.experience,
      coins: row.coins,
      gems: row.gems ?? 0,
      rumTokens: row.rumTokens,
      premium: row.premium,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt ?? undefined,
      stats,
      achievements: [],
      friends: [],
      blockedUsers: [],
      referredBy: row.referredBy ?? undefined,
      referralCode: row.referralCode ?? undefined,
      referralsCount: (row as { referralsCount?: number }).referralsCount ?? 0,
    };
  }

  // Sanitizar usuario (remover datos sensibles)
  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  // Generar token JWT
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
  }

  // Configuración por defecto
  private getDefaultSettings(): AccountSettings {
    return {
      notifications: {
        gameInvites: true,
        tournamentReminders: true,
        friendRequests: true,
        achievements: true,
        marketing: false,
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showStats: true,
        allowFriendRequests: true,
      },
      gameplay: {
        soundEnabled: true,
        musicEnabled: true,
        animationsEnabled: true,
        theme: 'auto',
        language: 'es',
      },
    };
  }

  // Estadísticas por defecto
  private getDefaultStats(): UserStats {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalScore: 0,
      tournamentsWon: 0,
      longestStreak: 0,
      currentStreak: 0,
      bestRank: 0,
    };
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const accountService = new AccountService();
