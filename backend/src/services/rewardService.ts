// Servicio de Premios y Recompensas
import { User } from '../../../shared/types';

export interface Reward {
  id: string;
  userId: string;
  type: 'daily' | 'achievement' | 'tournament' | 'referral' | 'event' | 'purchase';
  category: 'coins' | 'tokens' | 'items' | 'premium' | 'experience';
  amount: number;
  itemId?: string;
  description: string;
  claimed: boolean;
  claimedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface DailyReward {
  day: number;
  reward: {
    type: 'coins' | 'tokens' | 'items';
    amount: number;
    itemId?: string;
  };
}

export class RewardService {
  // Recompensas diarias
  private dailyRewards: DailyReward[] = [
    { day: 1, reward: { type: 'coins', amount: 50 } },
    { day: 2, reward: { type: 'coins', amount: 75 } },
    { day: 3, reward: { type: 'coins', amount: 100 } },
    { day: 4, reward: { type: 'coins', amount: 150 } },
    { day: 5, reward: { type: 'tokens', amount: 10 } },
    { day: 6, reward: { type: 'coins', amount: 200 } },
    { day: 7, reward: { type: 'tokens', amount: 25, itemId: 'premium_week' } },
  ];

  // Reclamar recompensa diaria
  async claimDailyReward(userId: string): Promise<Reward> {
    // Obtener streak del usuario
    // const user = await UserModel.findById(userId);
    // const lastClaim = await RewardModel.findOne({
    //   userId,
    //   type: 'daily',
    //   claimed: true,
    // }).sort({ claimedAt: -1 });

    // Calcular día actual
    let currentDay = 1;
    // if (lastClaim) {
    //   const daysSince = Math.floor(
    //     (Date.now() - lastClaim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
    //   );
    //   if (daysSince === 0) {
    //     throw new Error('Ya reclamaste la recompensa de hoy');
    //   }
    //   if (daysSince === 1) {
    //     currentDay = (lastClaim.day || 0) + 1;
    //   } else {
    //     currentDay = 1; // Reset streak
    //   }
    // }

    // Obtener recompensa del día
    const dayReward = this.dailyRewards[
      Math.min(currentDay - 1, this.dailyRewards.length - 1)
    ];

    // Crear recompensa
    const reward: Reward = {
      id: this.generateRewardId(),
      userId,
      type: 'daily',
      category: dayReward.reward.type,
      amount: dayReward.reward.amount,
      itemId: dayReward.reward.itemId,
      description: `Recompensa diaria - Día ${currentDay}`,
      claimed: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      createdAt: new Date(),
    };

    // Guardar
    // await RewardModel.create(reward);

    // Aplicar recompensa
    await this.applyReward(userId, reward);

    return reward;
  }

  // Crear recompensa personalizada
  async createReward(
    userId: string,
    type: Reward['type'],
    category: Reward['category'],
    amount: number,
    description: string,
    itemId?: string,
    expiresAt?: Date
  ): Promise<Reward> {
    const reward: Reward = {
      id: this.generateRewardId(),
      userId,
      type,
      category,
      amount,
      itemId,
      description,
      claimed: false,
      expiresAt,
      createdAt: new Date(),
    };

    // Guardar
    // await RewardModel.create(reward);

    // Notificar al usuario
    // io.to(`user:${userId}`).emit('new-reward', reward);

    return reward;
  }

  // Reclamar recompensa
  async claimReward(userId: string, rewardId: string): Promise<Reward> {
    // const reward = await RewardModel.findOne({
    //   id: rewardId,
    //   userId,
    // });

    // if (!reward) {
    //   throw new Error('Recompensa no encontrada');
    // }

    // if (reward.claimed) {
    //   throw new Error('Recompensa ya reclamada');
    // }

    // if (reward.expiresAt && reward.expiresAt < new Date()) {
    //   throw new Error('Recompensa expirada');
    // }

    // Aplicar recompensa
    // await this.applyReward(userId, reward);

    // Marcar como reclamada
    // await RewardModel.updateOne(
    //   { id: rewardId },
    //   { $set: { claimed: true, claimedAt: new Date() } }
    // );

    // reward.claimed = true;
    // reward.claimedAt = new Date();

    // return reward;

    // Placeholder
    throw new Error('Not implemented');
  }

  // Aplicar recompensa al usuario
  private async applyReward(userId: string, reward: Reward): Promise<void> {
    // const user = await UserModel.findById(userId);
    // if (!user) return;

    switch (reward.category) {
      case 'coins':
        // await UserModel.updateOne(
        //   { id: userId },
        //   { $inc: { coins: reward.amount } }
        // );
        break;

      case 'tokens':
        // await UserModel.updateOne(
        //   { id: userId },
        //   { $inc: { rumTokens: reward.amount } }
        // );
        break;

      case 'experience':
        // await this.addExperience(userId, reward.amount);
        break;

      case 'items':
        if (reward.itemId) {
          // await this.addItemToUser(userId, reward.itemId);
        }
        break;

      case 'premium':
        // await UserModel.updateOne(
        //   { id: userId },
        //   {
        //     $set: {
        //       premium: true,
        //       premiumExpiresAt: new Date(Date.now() + reward.amount * 24 * 60 * 60 * 1000),
        //     },
        //   }
        // );
        break;
    }
  }

  // Obtener recompensas pendientes
  async getPendingRewards(userId: string): Promise<Reward[]> {
    // return await RewardModel.find({
    //   userId,
    //   claimed: false,
    //   $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    // }).sort({ createdAt: -1 });

    return [];
  }

  // Recompensa por referir usuario
  async rewardReferral(referrerId: string, referredId: string): Promise<void> {
    // Recompensa para quien refirió
    await this.createReward(
      referrerId,
      'referral',
      'coins',
      100,
      'Recompensa por referir un amigo'
    );

    // Recompensa para el referido
    await this.createReward(
      referredId,
      'referral',
      'coins',
      50,
      'Recompensa por unirte con código de referencia'
    );
  }

  // Recompensa por ganar torneo
  async rewardTournamentWin(
    userId: string,
    tournamentId: string,
    position: number,
    prizeAmount: number
  ): Promise<void> {
    await this.createReward(
      userId,
      'tournament',
      'coins',
      prizeAmount,
      `Premio por posición ${position} en torneo`
    );
  }

  private generateRewardId(): string {
    return `reward_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const rewardService = new RewardService();
