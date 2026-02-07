// Servicio de Salas de Juego e Invitaciones
import { Game, GameMode, Player } from '../../../shared/types';
import { io } from '../server.js';

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  gameMode: GameMode;
  isPrivate: boolean;
  password?: string;
  inviteCode: string;
  inviteLink: string;
  settings: GameRoomSettings;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  createdAt: Date;
  startedAt?: Date;
}

export interface GameRoomSettings {
  maxPlayers: 2 | 3 | 4;
  gameMode: 'classic' | 'fast' | 'tournament';
  timeLimit?: number; // En segundos, undefined = sin límite
  initialTiles: number; // Fichas iniciales (normalmente 14)
  allowJokers: boolean;
  minInitialScore: number; // Puntuación mínima para primera jugada (normalmente 30)
  allowRearrange: boolean; // Permitir reorganizar tablero
  customRules?: {
    [key: string]: any;
  };
}

export class GameRoomService {
  private rooms: Map<string, GameRoom> = new Map();
  private userRooms: Map<string, string> = new Map(); // userId -> roomId

  // Crear nueva sala
  createRoom(
    hostId: string,
    name: string,
    settings: Partial<GameRoomSettings>,
    isPrivate: boolean = false,
    password?: string
  ): GameRoom {
    const roomId = this.generateRoomId();
    const inviteCode = this.generateInviteCode();

    const defaultSettings: GameRoomSettings = {
      maxPlayers: 4,
      gameMode: 'classic',
      timeLimit: undefined,
      initialTiles: 14,
      allowJokers: true,
      minInitialScore: 30,
      allowRearrange: true,
    };

    const room: GameRoom = {
      id: roomId,
      name: name || `Sala de ${hostId}`,
      hostId,
      players: [],
      maxPlayers: settings.maxPlayers || defaultSettings.maxPlayers,
      gameMode: settings.gameMode || defaultSettings.gameMode,
      isPrivate,
      password,
      inviteCode,
      inviteLink: `${process.env.FRONTEND_URL}/join/${inviteCode}`,
      settings: { ...defaultSettings, ...settings },
      status: 'waiting',
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.userRooms.set(hostId, roomId);

    // Notificar al host
    io.to(`user:${hostId}`).emit('room-created', room);

    return room;
  }

  // Unirse a sala por código
  async joinRoomByCode(
    userId: string,
    inviteCode: string,
    password?: string
  ): Promise<GameRoom> {
    const room = Array.from(this.rooms.values()).find(
      (r) => r.inviteCode === inviteCode
    );

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    if (room.isPrivate && room.password !== password) {
      throw new Error('Contraseña incorrecta');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Sala llena');
    }

    if (room.status !== 'waiting') {
      throw new Error('La partida ya comenzó');
    }

    // Verificar si el usuario ya está en la sala
    if (room.players.some((p) => p.userId === userId)) {
      throw new Error('Ya estás en esta sala');
    }

    // Agregar jugador
    const player: Player = {
      id: this.generatePlayerId(),
      userId,
      name: `Jugador ${room.players.length + 1}`, // Se actualizará con el nombre real del usuario
      tiles: [],
      score: 0,
    };

    room.players.push(player);
    this.userRooms.set(userId, room.id);

    // Notificar a todos en la sala
    io.to(`room:${room.id}`).emit('player-joined', {
      player,
      room: this.getRoomInfo(room),
    });

    // Notificar al nuevo jugador
    io.to(`user:${userId}`).emit('joined-room', this.getRoomInfo(room));

    return room;
  }

  // Unirse a sala por ID
  async joinRoomById(
    userId: string,
    roomId: string,
    password?: string
  ): Promise<GameRoom> {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    return this.joinRoomByCode(userId, room.inviteCode, password);
  }

  // Invitar jugadores
  async invitePlayers(
    roomId: string,
    hostId: string,
    userIds: string[],
    message?: string
  ): Promise<void> {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    if (room.hostId !== hostId) {
      throw new Error('Solo el anfitrión puede invitar');
    }

    // Enviar invitaciones
    for (const userId of userIds) {
      const invitation = {
        id: this.generateInvitationId(),
        roomId,
        roomName: room.name,
        hostId,
        inviteCode: room.inviteCode,
        inviteLink: room.inviteLink,
        message: message || `Te invitaron a jugar Rummikub`,
        createdAt: new Date(),
      };

      // Notificar al usuario
      io.to(`user:${userId}`).emit('game-invitation', invitation);

      // También enviar notificación push si está disponible
      // await notificationService.sendPushNotification(userId, {
      //   title: 'Invitación a Rummikub',
      //   body: `${room.name} te invitó a jugar`,
      //   data: invitation,
      // });
    }
  }

  // Invitar por enlace público
  generatePublicInvite(roomId: string): {
    code: string;
    link: string;
    qrCode: string;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    return {
      code: room.inviteCode,
      link: room.inviteLink,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(room.inviteLink)}`,
    };
  }

  // Salir de la sala
  async leaveRoom(userId: string, roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    // Remover jugador
    room.players = room.players.filter((p) => p.userId !== userId);
    this.userRooms.delete(userId);

    // Si era el host y hay otros jugadores, transferir host
    if (room.hostId === userId && room.players.length > 0) {
      room.hostId = room.players[0].userId;
      io.to(`room:${room.id}`).emit('host-changed', {
        newHostId: room.hostId,
      });
    }

    // Si no quedan jugadores, eliminar sala
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    } else {
      // Notificar a los demás
      io.to(`room:${room.id}`).emit('player-left', {
        userId,
        room: this.getRoomInfo(room),
      });
    }
  }

  // Iniciar partida
  async startGame(roomId: string, hostId: string): Promise<Game> {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    if (room.hostId !== hostId) {
      throw new Error('Solo el anfitrión puede iniciar la partida');
    }

    if (room.players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores');
    }

    if (room.status !== 'waiting') {
      throw new Error('La partida ya comenzó');
    }

    // Cambiar estado
    room.status = 'starting';
    room.startedAt = new Date();

    // Crear juego (lógica del juego)
    const game = await this.createGameFromRoom(room);

    // Notificar a todos
    io.to(`room:${room.id}`).emit('game-started', {
      game,
      room: this.getRoomInfo(room),
    });

    return game;
  }

  // Buscar partida pública (matchmaking)
  async findPublicGame(
    userId: string,
    preferences: {
      gameMode?: GameMode;
      maxPlayers?: number;
    }
  ): Promise<GameRoom | null> {
    // Buscar sala pública disponible
    const availableRooms = Array.from(this.rooms.values()).filter(
      (room) =>
        !room.isPrivate &&
        room.status === 'waiting' &&
        room.players.length < room.maxPlayers &&
        (!preferences.gameMode || room.gameMode === preferences.gameMode) &&
        (!preferences.maxPlayers || room.maxPlayers === preferences.maxPlayers)
    );

    if (availableRooms.length === 0) {
      // Crear nueva sala pública
      return this.createRoom(
        userId,
        'Partida Pública',
        {
          gameMode: preferences.gameMode || 'classic',
          maxPlayers: (preferences.maxPlayers || 4) as 2 | 3 | 4,
        },
        false
      );
    }

    // Unirse a la primera sala disponible
    const room = availableRooms[0];
    await this.joinRoomByCode(userId, room.inviteCode);

    return room;
  }

  // Obtener información de la sala (sin datos sensibles)
  getRoomInfo(room: GameRoom): Partial<GameRoom> {
    return {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      players: room.players.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
      })),
      maxPlayers: room.maxPlayers,
      gameMode: room.gameMode,
      isPrivate: room.isPrivate,
      settings: room.settings,
      status: room.status,
      inviteCode: room.inviteCode,
      inviteLink: room.inviteLink,
      createdAt: room.createdAt,
    };
  }

  // Obtener sala por ID
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  // Obtener sala del usuario
  getUserRoom(userId: string): GameRoom | undefined {
    const roomId = this.userRooms.get(userId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  // Listar salas públicas
  getPublicRooms(): GameRoom[] {
    return Array.from(this.rooms.values()).filter(
      (room) => !room.isPrivate && room.status === 'waiting'
    );
  }

  // Crear juego desde sala
  private async createGameFromRoom(room: GameRoom): Promise<Game> {
    // Aquí iría la lógica completa de inicialización del juego
    // Generar fichas, repartir, etc.
    
    const game: Game = {
      id: this.generateGameId(),
      players: room.players,
      currentPlayerIndex: 0,
      pool: [], // Se generará con todas las fichas
      board: [],
      gameMode: room.gameMode,
      status: 'playing',
      startedAt: new Date(),
      chat: [],
    };

    return game;
  }

  // Generadores de IDs
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateInvitationId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const gameRoomService = new GameRoomService();
