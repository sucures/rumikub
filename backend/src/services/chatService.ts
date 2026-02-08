// Servicio de Chat con Fotos
import { ChatMessage } from '../../../shared/types';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../server.js';

export interface PrivateChatMessage extends ChatMessage {
  recipientId?: string; // Para mensajes privados
  imageUrl?: string; // URL de la imagen
  imageThumbnail?: string; // Thumbnail de la imagen
  isPrivate: boolean;
}

export interface ChatRoom {
  id: string;
  type: 'game' | 'private' | 'group';
  participants: string[]; // User IDs
  gameId?: string;
  lastMessage?: PrivateChatMessage;
  lastMessageAt?: Date;
  createdAt: Date;
}

export class ChatService {
  private s3Client: S3Client;
  private chatRooms: Map<string, ChatRoom> = new Map();

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  // Enviar mensaje en chat de partida
  async sendGameMessage(
    gameId: string,
    userId: string,
    message: string,
    image?: Buffer,
    mimeType?: string
  ): Promise<PrivateChatMessage> {
    let imageUrl: string | undefined;
    let imageThumbnail: string | undefined;

    // Si hay imagen, subirla
    if (image && mimeType) {
      imageUrl = await this.uploadImage(image, mimeType, `game/${gameId}`);
      imageThumbnail = await this.createThumbnail(imageUrl);
    }

    // Obtener información del usuario
    // const user = await UserModel.findById(userId);
    const username = 'Usuario'; // user?.username || 'Usuario';
    const avatar = undefined; // user?.avatar;

    const chatMessage: PrivateChatMessage = {
      id: this.generateMessageId(),
      userId,
      username,
      avatar,
      message,
      timestamp: new Date(),
      type: image ? 'image' : 'text',
      gameId,
      imageUrl,
      imageThumbnail,
      isPrivate: false,
    };

    // Guardar mensaje
    // await ChatMessageModel.create(chatMessage);

    // Enviar a todos en la partida
    io.to(`game:${gameId}`).emit('chat-message', chatMessage);

    return chatMessage;
  }

  // Enviar mensaje privado
  async sendPrivateMessage(
    senderId: string,
    recipientId: string,
    message: string,
    image?: Buffer,
    mimeType?: string
  ): Promise<PrivateChatMessage> {
    // Verificar si el remitente está bloqueado
    // const recipient = await UserModel.findById(recipientId);
    // if (recipient?.blockedUsers?.includes(senderId)) {
    //   throw new Error('El usuario te ha bloqueado');
    // }

    let imageUrl: string | undefined;
    let imageThumbnail: string | undefined;

    // Si hay imagen, subirla
    if (image && mimeType) {
      imageUrl = await this.uploadImage(image, mimeType, `private/${senderId}`);
      imageThumbnail = await this.createThumbnail(imageUrl);
    }

    // Obtener información del usuario
    // const user = await UserModel.findById(senderId);
    const username = 'Usuario'; // user?.username || 'Usuario';
    const avatar = undefined; // user?.avatar;

    const chatMessage: PrivateChatMessage = {
      id: this.generateMessageId(),
      userId: senderId,
      username,
      avatar,
      message,
      timestamp: new Date(),
      type: image ? 'image' : 'text',
      recipientId,
      imageUrl,
      imageThumbnail,
      isPrivate: true,
    };

    // Guardar mensaje
    // await ChatMessageModel.create(chatMessage);

    // Obtener o crear sala de chat privado
    const roomId = this.getOrCreatePrivateRoom(senderId, recipientId);
    this.updateRoomLastMessage(roomId, chatMessage);

    // Enviar al destinatario
    io.to(`user:${recipientId}`).emit('private-message', chatMessage);
    io.to(`user:${senderId}`).emit('private-message-sent', chatMessage);

    return chatMessage;
  }

  // Obtener historial de chat de partida
  async getGameChatHistory(gameId: string, limit: number = 50): Promise<PrivateChatMessage[]> {
    // return await ChatMessageModel.find({
    //   gameId,
    //   isPrivate: false,
    // })
    //   .sort({ timestamp: -1 })
    //   .limit(limit)
    //   .sort({ timestamp: 1 });

    return [];
  }

  // Obtener historial de chat privado
  async getPrivateChatHistory(
    userId1: string,
    userId2: string,
    limit: number = 50
  ): Promise<PrivateChatMessage[]> {
    // return await ChatMessageModel.find({
    //   $or: [
    //     { userId: userId1, recipientId: userId2, isPrivate: true },
    //     { userId: userId2, recipientId: userId1, isPrivate: true },
    //   ],
    // })
    //   .sort({ timestamp: -1 })
    //   .limit(limit)
    //   .sort({ timestamp: 1 });

    return [];
  }

  // Obtener salas de chat del usuario
  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    // return await ChatRoomModel.find({
    //   participants: userId,
    // })
    //   .sort({ lastMessageAt: -1 });

    return Array.from(this.chatRooms.values()).filter((room) =>
      room.participants.includes(userId)
    );
  }

  // Subir imagen
  private async uploadImage(
    file: Buffer,
    mimeType: string,
    folder: string
  ): Promise<string> {
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('Tipo de archivo no permitido. Solo se permiten imágenes.');
    }

    // Validar tamaño (máximo 5MB)
    if (file.length > 5 * 1024 * 1024) {
      throw new Error('La imagen es demasiado grande. Máximo 5MB.');
    }

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

    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${fileName}`;
  }

  // Crear thumbnail (simplificado - en producción usar servicio de procesamiento de imágenes)
  private async createThumbnail(imageUrl: string): Promise<string> {
    // En producción, usar un servicio como AWS Lambda + Sharp o ImageMagick
    // Por ahora, retornar la misma URL (el frontend puede usar CSS para hacer thumbnail)
    return imageUrl;
  }

  // Obtener o crear sala de chat privado
  private getOrCreatePrivateRoom(userId1: string, userId2: string): string {
    // Buscar sala existente
    for (const [roomId, room] of this.chatRooms.entries()) {
      if (
        room.type === 'private' &&
        room.participants.includes(userId1) &&
        room.participants.includes(userId2) &&
        room.participants.length === 2
      ) {
        return roomId;
      }
    }

    // Crear nueva sala
    const roomId = this.generateRoomId();
    const room: ChatRoom = {
      id: roomId,
      type: 'private',
      participants: [userId1, userId2],
      createdAt: new Date(),
    };

    this.chatRooms.set(roomId, room);
    return roomId;
  }

  // Actualizar último mensaje de la sala
  private updateRoomLastMessage(roomId: string, message: PrivateChatMessage): void {
    const room = this.chatRooms.get(roomId);
    if (room) {
      room.lastMessage = message;
      room.lastMessageAt = new Date();
    }
  }

  // Generadores de IDs
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const chatService = new ChatService();
