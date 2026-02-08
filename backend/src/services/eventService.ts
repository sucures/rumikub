// Servicio de Eventos
import { User } from '../../../shared/types';

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: 'tournament' | 'special_game' | 'community' | 'promotion' | 'seasonal';
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'finished';
  rewards: EventReward[];
  participants: string[]; // User IDs
  maxParticipants?: number;
  requirements?: EventRequirements;
  bannerImage?: string;
  rules?: string;
}

export interface EventReward {
  position?: number; // Para torneos
  type: 'coins' | 'tokens' | 'items' | 'premium' | 'nft';
  amount: number;
  itemId?: string;
  description: string;
}

export interface EventRequirements {
  minLevel?: number;
  minGamesPlayed?: number;
  premiumOnly?: boolean;
  inviteCode?: string;
}

export class EventService {
  private events: Map<string, GameEvent> = new Map();

  // Crear nuevo evento
  async createEvent(eventData: Partial<GameEvent>): Promise<GameEvent> {
    const event: GameEvent = {
      id: this.generateEventId(),
      name: eventData.name || 'Nuevo Evento',
      description: eventData.description || '',
      type: eventData.type || 'special_game',
      startDate: eventData.startDate || new Date(),
      endDate: eventData.endDate || new Date(),
      status: 'upcoming',
      rewards: eventData.rewards || [],
      participants: [],
      maxParticipants: eventData.maxParticipants,
      requirements: eventData.requirements,
      bannerImage: eventData.bannerImage,
      rules: eventData.rules,
    };

    this.events.set(event.id, event);

    // Notificar a todos los usuarios
    // io.emit('new-event', this.getEventInfo(event));

    return event;
  }

  // Inscribirse a evento
  async registerForEvent(userId: string, eventId: string): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status !== 'upcoming' && event.status !== 'active') {
      throw new Error('El evento no está disponible');
    }

    // Verificar requisitos
    await this.checkRequirements(userId, event.requirements);

    // Verificar límite de participantes
    if (
      event.maxParticipants &&
      event.participants.length >= event.maxParticipants
    ) {
      throw new Error('Evento lleno');
    }

    // Verificar si ya está inscrito
    if (event.participants.includes(userId)) {
      throw new Error('Ya estás inscrito en este evento');
    }

    // Inscribir
    event.participants.push(userId);

    // Notificar
    // io.to(`user:${userId}`).emit('event-registered', {
    //   eventId,
    //   eventName: event.name,
    // });
  }

  // Verificar requisitos
  private async checkRequirements(
    userId: string,
    requirements?: EventRequirements
  ): Promise<void> {
    if (!requirements) return;

    // const user = await UserModel.findById(userId);
    // if (!user) {
    //   throw new Error('Usuario no encontrado');
    // }

    // if (requirements.minLevel && user.level < requirements.minLevel) {
    //   throw new Error(`Se requiere nivel ${requirements.minLevel}`);
    // }

    // if (
    //   requirements.minGamesPlayed &&
    //   user.stats.gamesPlayed < requirements.minGamesPlayed
    // ) {
    //   throw new Error(
    //     `Se requieren ${requirements.minGamesPlayed} partidas jugadas`
    //   );
    // }

    // if (requirements.premiumOnly && !user.premium) {
    //   throw new Error('Se requiere cuenta premium');
    // }
  }

  // Iniciar evento
  async startEvent(eventId: string): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status !== 'upcoming') {
      throw new Error('El evento no puede iniciarse');
    }

    event.status = 'active';

    // Notificar a participantes
    // for (const userId of event.participants) {
    //   io.to(`user:${userId}`).emit('event-started', {
    //     eventId,
    //     eventName: event.name,
    //   });
    // }
  }

  // Finalizar evento y distribuir premios
  async finishEvent(eventId: string, results: { userId: string; position: number }[]): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    event.status = 'finished';

    // Distribuir premios
    for (const result of results) {
      const reward = event.rewards.find((r) => r.position === result.position);
      if (reward) {
        // await rewardService.createReward(
        //   result.userId,
        //   'event',
        //   reward.type,
        //   reward.amount,
        //   `Premio del evento: ${event.name}`,
        //   reward.itemId
        // );
      }
    }

    // Notificar a participantes
    // io.emit('event-finished', {
    //   eventId,
    //   eventName: event.name,
    //   results,
    // });
  }

  // Obtener eventos activos
  getActiveEvents(): GameEvent[] {
    return Array.from(this.events.values()).filter(
      (event) => event.status === 'active' || event.status === 'upcoming'
    );
  }

  // Obtener eventos por tipo
  getEventsByType(type: GameEvent['type']): GameEvent[] {
    return Array.from(this.events.values()).filter((event) => event.type === type);
  }

  // Obtener información del evento (sin datos sensibles)
  getEventInfo(event: GameEvent): Partial<GameEvent> {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      rewards: event.rewards,
      maxParticipants: event.maxParticipants,
      requirements: event.requirements,
      bannerImage: event.bannerImage,
      rules: event.rules,
      participantsCount: event.participants.length,
    };
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const eventService = new EventService();
