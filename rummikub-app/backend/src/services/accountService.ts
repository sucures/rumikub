// Servicio de Gestión de Cuentas
import { User, UserStats, Achievement } from '../../../shared/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    // Verificar si el email ya existe
    // const existingUser = await UserModel.findOne({ email });
    // if (existingUser) {
    //   throw new Error('El email ya está registrado');
    // }

    // Verificar si el username ya existe
    // const existingUsername = await UserModel.findOne({ username });
    // if (existingUsername) {
    //   throw new Error('El nombre de usuario ya está en uso');
    // }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const user: User = {
      id: this.generateUserId(),
      email,
      username,
      passwordHash,
      level: 1,
      experience: 0,
      coins: 100, // Coins iniciales
      rumTokens: 0,
      premium: false,
      createdAt: new Date(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalScore: 0,
        tournamentsWon: 0,
        longestStreak: 0,
        currentStreak: 0,
        bestRank: 0,
      },
      achievements: [],
      friends: [],
      blockedUsers: [],
      referredBy,
    };

    // Si fue referido, procesar referencia
    if (referredBy) {
      // await this.processReferral(referredBy, user.id);
    }

    // Guardar en base de datos
    // await UserModel.create(user);

    // Generar token JWT
    const token = this.generateToken(user.id);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Iniciar sesión
  async login(email: string, password: string): Promise<{ user: Partial<User>; token: string }> {
    // Buscar usuario
    // const user = await UserModel.findOne({ email });
    // if (!user) {
    //   throw new Error('Credenciales inválidas');
    // }

    // Verificar contraseña
    // const isValid = await bcrypt.compare(password, user.passwordHash);
    // if (!isValid) {
    //   throw new Error('Credenciales inválidas');
    // }

    // Actualizar último login
    // await UserModel.updateOne(
    //   { id: user.id },
    //   { $set: { lastLoginAt: new Date() } }
    // );

    // Generar token
    // const token = this.generateToken(user.id);

    // return {
    //   user: this.sanitizeUser(user),
    //   token,
    // };

    // Placeholder
    throw new Error('Not implemented');
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
    // Verificar que el username no esté en uso
    if (updates.username) {
      // const existing = await UserModel.findOne({
      //   username: updates.username,
      //   id: { $ne: userId },
      // });
      // if (existing) {
      //   throw new Error('El nombre de usuario ya está en uso');
      // }
    }

    // Actualizar usuario
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $set: updates }
    // );

    // const user = await UserModel.findById(userId);
    // return this.sanitizeUser(user);

    // Placeholder
    return {};
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
