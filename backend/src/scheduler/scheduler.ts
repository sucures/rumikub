// Cron scheduler — automated notifications and system actions
import cron from 'node-cron';
import {
  findUpcomingTournaments,
  findReadyMatches,
  findNewReferralRewards,
  findScheduledAnnouncements,
  cleanupInvalidTokens,
  markMatchReadyNotified,
  markRewardNotified,
  markAnnouncementSent,
  getAllUserIds,
} from '../services/schedulerHelpers.js';
import { assignDailyMotivation } from '../services/motivationService.js';
import {
  triggerTournamentStarting,
  triggerMatchReady,
  triggerReferralReward,
  triggerSystemMessage,
} from '../services/notificationTriggers.js';
import { runRecoveryCleanup } from '../jobs/recoveryCleanupJob.js';

const LOG_PREFIX = '[scheduler]';

function runJob(name: string, fn: () => Promise<void>): void {
  void (async () => {
    const start = Date.now();
    console.log(`${LOG_PREFIX} Job "${name}" started`);
    try {
      await fn();
      console.log(`${LOG_PREFIX} Job "${name}" finished (${Date.now() - start}ms)`);
    } catch (err: any) {
      console.error(`${LOG_PREFIX} Job "${name}" error:`, err);
    }
  })();
}

export function startScheduler(): void {
  // Tournament reminders — every minute
  cron.schedule('* * * * *', () => {
    runJob('tournament-reminders', async () => {
      const participants = await findUpcomingTournaments();
      for (const { tournamentId, userId } of participants) {
        try {
          await triggerTournamentStarting(tournamentId, userId);
        } catch (e) {
          console.warn(`${LOG_PREFIX} triggerTournamentStarting failed:`, e);
        }
      }
    });
  });

  // Match readiness checks — every minute
  cron.schedule('* * * * *', () => {
    runJob('match-readiness', async () => {
      const matches = await findReadyMatches();
      for (const m of matches) {
        try {
          for (const userId of m.playerIds) {
            await triggerMatchReady(m.matchId, userId, m.tournamentId, m.roundNumber);
          }
          await markMatchReadyNotified(m.matchId);
        } catch (e) {
          console.warn(`${LOG_PREFIX} triggerMatchReady/mark failed:`, e);
        }
      }
    });
  });

  // Referral reward notifications — every hour
  cron.schedule('0 * * * *', () => {
    runJob('referral-rewards', async () => {
      const rewards = await findNewReferralRewards();
      for (const r of rewards) {
        try {
          await triggerReferralReward(r.userId, r.rewardId, r.rewardCoins, r.rewardGems);
          await markRewardNotified(r.rewardId);
        } catch (e) {
          console.warn(`${LOG_PREFIX} triggerReferralReward/mark failed:`, e);
        }
      }
    });
  });

  // System announcements — daily at 09:00
  cron.schedule('0 9 * * *', () => {
    runJob('system-announcements', async () => {
      const announcements = await findScheduledAnnouncements();
      const userIds = await getAllUserIds();
      for (const a of announcements) {
        try {
          for (const userId of userIds) {
            await triggerSystemMessage(userId, a.title, a.message);
          }
          await markAnnouncementSent(a.id);
        } catch (e) {
          console.warn(`${LOG_PREFIX} triggerSystemMessage/mark failed:`, e);
        }
      }
    });
  });

  // Assign daily motivation — daily at 00:01
  cron.schedule('1 0 * * *', () => {
    runJob('assign-daily-motivation', async () => {
      await assignDailyMotivation();
    });
  });

  // Cleanup invalid push tokens — daily at 03:00
  cron.schedule('0 3 * * *', () => {
    runJob('cleanup-invalid-tokens', async () => {
      const deleted = await cleanupInvalidTokens();
      if (deleted > 0) {
        console.log(`${LOG_PREFIX} Removed ${deleted} invalid push token(s)`);
      }
    });
  });

  // Recovery ticket cleanup — every hour (Step Security.10)
  cron.schedule('0 * * * *', () => {
    runJob('recovery-cleanup', runRecoveryCleanup);
  });

  console.log(`${LOG_PREFIX} Scheduler started`);
}
