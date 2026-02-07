// Servicio de Juegos Personalizados con Apuestas
import { Game, GameMode, Player } from '../../../shared/types';
import { cryptoService } from './cryptoService.js';

export interface CustomGameSettings {
  // Configuración de apuestas
  betType: 'coins' | 'tokens' | 'none';
  betAmount: number; // De 10 a 1,000,000
  useRealTokens: boolean; // Tokens convertibles a cripto real
  
  // Configuración de tiempo
  timePerMove: number; // 10 a 30 segundos (mínimo 10, máximo 30)
  timePerGame?: number; // Tiempo total por partida (opcional)
  timeWarning?: number; // Advertencia cuando quedan X segundos
  
  // Configuración de fichas
  initialTiles: number; // Fichas iniciales
  allowJokers: boolean;
  minInitialScore: number;
  
  // Configuración de premios
  prizeDistribution: {
    winner: number; // Porcentaje para el ganador
    second?: number;
    third?: number;
  };
  
  // Otras configuraciones
  maxPlayers: 2 | 3 | 4;
  allowRearrange: boolean;
  private: boolean;
  password?: string;
}

export interface GameBet {
  id: string;
  gameId: string;
  playerId: string;
  amount: number;
  currency: 'coins' | 'tokens';
  status: 'pending' | 'locked' | 'won' | 'lost' | 'refunded';
  lockedAt?: Date;
  resolvedAt?: Date;
}

export interface TokenConversion {
  id: string;
  userId: string;
  fromAmount: number; // Cantidad en tokens del juego
  toAmount: number; // Cantidad en RUM tokens (cripto real)
  rate: number; // Tasa de conversión
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class CustomGameService {
  private activeBets: Map<string, GameBet> = new Map();
  private conversionRate = 1000; // 1000 tokens del juego = 1 RUM token real

  // Crear juego personalizado con apuestas
  async createCustomGame(
    hostId: string,
    settings: CustomGameSettings
  ): Promise<{ gameId: string; roomId: string; settings: CustomGameSettings }> {
    // Validar configuración
    this.validateSettings(settings);

    // Si hay apuestas, bloquear fondos
    if (settings.betType !== 'none' && settings.betAmount > 0) {
      await this.lockBet(hostId, settings.betAmount, settings.betType, settings.useRealTokens);
    }

    // Crear sala de juego
    const roomId = this.generateRoomId();
    const gameId = this.generateGameId();

    // Guardar configuración
    // await CustomGameModel.create({
    //   id: gameId,
    //   roomId,
    //   hostId,
    //   settings,
    //   status: 'waiting',
    //   createdAt: new Date(),
    // });

    return { gameId, roomId, settings };
  }

  // Unirse a juego con apuesta
  async joinCustomGame(
    userId: string,
    gameId: string,
    password?: string
  ): Promise<void> {
    // const game = await CustomGameModel.findById(gameId);
    // if (!game) {
    //   throw new Error('Juego no encontrado');
    // }

    // if (game.settings.private && game.settings.password !== password) {
    //   throw new Error('Contraseña incorrecta');
    // }

    // Si hay apuestas, bloquear fondos
    // if (game.settings.betType !== 'none' && game.settings.betAmount > 0) {
    //   await this.lockBet(
    //     userId,
    //     game.settings.betAmount,
    //     game.settings.betType,
    //     game.settings.useRealTokens
    //   );
    // }

    // Agregar jugador a la sala
    // await this.addPlayerToRoom(game.roomId, userId);
  }

  // Bloquear apuesta
  private async lockBet(
    userId: string,
    amount: number,
    currency: 'coins' | 'tokens',
    useRealTokens: boolean
  ): Promise<GameBet> {
    // const user = await UserModel.findById(userId);
    // if (!user) {
    //   throw new Error('Usuario no encontrado');
    // }

    // Verificar fondos
    if (currency === 'coins') {
      // if (user.coins < amount) {
      //   throw new Error('Fondos insuficientes');
      // }
      // await UserModel.updateOne(
      //   { id: userId },
      //   { $inc: { coins: -amount } }
      // );
    } else if (currency === 'tokens') {
      if (useRealTokens) {
        // Verificar tokens reales (RUM)
        // const balance = await cryptoService.getRUMBalance(user.walletAddress || '');
        // if (balance < amount / this.conversionRate) {
        //   throw new Error('Tokens insuficientes');
        // }
      } else {
        // if (user.rumTokens < amount) {
        //   throw new Error('Tokens insuficientes');
        // }
        // await UserModel.updateOne(
        //   { id: userId },
        //   { $inc: { rumTokens: -amount } }
        // );
      }
    }

    const bet: GameBet = {
      id: this.generateBetId(),
      gameId: '', // Se asignará después
      playerId: userId,
      amount,
      currency,
      status: 'locked',
      lockedAt: new Date(),
    };

    this.activeBets.set(bet.id, bet);
    return bet;
  }

  // Finalizar juego y distribuir premios
  async finishCustomGame(
    gameId: string,
    results: { playerId: string; position: number; score: number }[]
  ): Promise<void> {
    // const game = await CustomGameModel.findById(gameId);
    // if (!game) {
    //   throw new Error('Juego no encontrado');
    // }

    // Calcular pool total
    const totalPool = results.length * game.settings.betAmount;
    const prizePool = this.calculatePrizePool(totalPool, game.settings.prizeDistribution);

    // Distribuir premios
    for (const result of results) {
      const prize = prizePool[result.position - 1];
      if (prize && prize > 0) {
        await this.distributePrize(
          result.playerId,
          prize,
          game.settings.betType,
          game.settings.useRealTokens
        );
      }

      // Resolver apuesta
      // const bet = await this.findBet(gameId, result.playerId);
      // if (bet) {
      //   bet.status = result.position === 1 ? 'won' : 'lost';
      //   bet.resolvedAt = new Date();
      // }
    }

    // Marcar juego como finalizado
    // await CustomGameModel.updateOne(
    //   { id: gameId },
    //   { $set: { status: 'finished', finishedAt: new Date() } }
    // );
  }

  // Distribuir premio
  private async distributePrize(
    userId: string,
    amount: number,
    currency: 'coins' | 'tokens',
    useRealTokens: boolean
  ): Promise<void> {
    if (currency === 'coins') {
      // await UserModel.updateOne(
      //   { id: userId },
      //   { $inc: { coins: amount } }
      // );
    } else if (currency === 'tokens') {
      if (useRealTokens) {
        // Transferir tokens reales (RUM)
        // const user = await UserModel.findById(userId);
        // if (user?.walletAddress) {
        //   const rumAmount = amount / this.conversionRate;
        //   await cryptoService.transferRUM(user.walletAddress, rumAmount);
        // }
      } else {
        // await UserModel.updateOne(
        //   { id: userId },
        //   { $inc: { rumTokens: amount } }
        // );
      }
    }
  }

  // Convertir tokens del juego a tokens reales (RUM)
  async convertTokensToReal(
    userId: string,
    amount: number
  ): Promise<TokenConversion> {
    // Verificar que el usuario tenga suficientes tokens
    // const user = await UserModel.findById(userId);
    // if (!user || user.rumTokens < amount) {
    //   throw new Error('Tokens insuficientes');
    // }

    // Calcular cantidad en RUM
    const rumAmount = amount / this.conversionRate;

    // Verificar que haya fondos en el contrato
    // const contractBalance = await cryptoService.getRUMBalance(
    //   process.env.TREASURY_ADDRESS || ''
    // );
    // if (contractBalance < rumAmount) {
    //   throw new Error('Fondos insuficientes en el contrato');
    // }

    // Crear registro de conversión
    const conversion: TokenConversion = {
      id: this.generateConversionId(),
      userId,
      fromAmount: amount,
      toAmount: rumAmount,
      rate: this.conversionRate,
      status: 'pending',
      createdAt: new Date(),
    };

    // Transferir tokens reales
    // const user = await UserModel.findById(userId);
    // if (user?.walletAddress) {
    //   try {
    //     const txHash = await cryptoService.transferRUM(user.walletAddress, rumAmount);
    //     conversion.txHash = txHash;
    //     conversion.status = 'completed';
    //     conversion.completedAt = new Date();

    //     // Descontar tokens del juego
    //     await UserModel.updateOne(
    //       { id: userId },
    //       { $inc: { rumTokens: -amount } }
    //     );
    //   } catch (error) {
    //     conversion.status = 'failed';
    //     throw error;
    //   }
    // }

    // Guardar conversión
    // await TokenConversionModel.create(conversion);

    return conversion;
  }

  // Convertir tokens reales (RUM) a tokens del juego
  async convertRealToTokens(
    userId: string,
    rumAmount: number,
    txHash: string
  ): Promise<TokenConversion> {
    // Verificar transacción
    // const tx = await cryptoService.verifyTransaction(txHash);
    // if (!tx || tx.status !== 'confirmed') {
    //   throw new Error('Transacción no confirmada');
    // }

    // Calcular cantidad en tokens del juego
    const gameTokens = rumAmount * this.conversionRate;

    // Crear registro de conversión
    const conversion: TokenConversion = {
      id: this.generateConversionId(),
      userId,
      fromAmount: rumAmount,
      toAmount: gameTokens,
      rate: this.conversionRate,
      status: 'completed',
      txHash,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    // Agregar tokens al usuario
    // await UserModel.updateOne(
    //   { id: userId },
    //   { $inc: { rumTokens: gameTokens } }
    // );

    // Guardar conversión
    // await TokenConversionModel.create(conversion);

    return conversion;
  }

  // Validar configuración
  private validateSettings(settings: CustomGameSettings): void {
    // Validar tiempo por jugada (10-30 segundos)
    if (settings.timePerMove < 10 || settings.timePerMove > 30) {
      throw new Error('El tiempo por jugada debe estar entre 10 y 30 segundos');
    }

    // Validar cantidad de apuesta (10 a 1,000,000)
    if (settings.betType !== 'none') {
      if (settings.betAmount < 10 || settings.betAmount > 1000000) {
        throw new Error('La apuesta debe estar entre 10 y 1,000,000');
      }
    }

    // Validar distribución de premios
    const totalPercentage = Object.values(settings.prizeDistribution).reduce(
      (sum, val) => sum + (val || 0),
      0
    );
    if (totalPercentage > 100) {
      throw new Error('La distribución de premios no puede exceder el 100%');
    }
  }

  // Calcular pool de premios
  private calculatePrizePool(
    totalPool: number,
    distribution: CustomGameSettings['prizeDistribution']
  ): number[] {
    const prizes: number[] = [];
    
    if (distribution.winner) {
      prizes.push((totalPool * distribution.winner) / 100);
    }
    if (distribution.second) {
      prizes.push((totalPool * distribution.second) / 100);
    }
    if (distribution.third) {
      prizes.push((totalPool * distribution.third) / 100);
    }

    return prizes;
  }

  // Obtener tasa de conversión actual
  getConversionRate(): number {
    return this.conversionRate;
  }

  // Actualizar tasa de conversión (solo admin)
  setConversionRate(rate: number): void {
    if (rate <= 0) {
      throw new Error('La tasa de conversión debe ser mayor a 0');
    }
    this.conversionRate = rate;
  }

  // Generadores de IDs
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateBetId(): string {
    return `bet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateConversionId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const customGameService = new CustomGameService();
