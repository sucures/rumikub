// Anti-cheat & fair play engine (Step 25)
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { gameActionLogs, suspiciousEvents, userReputation, tournamentMatches } from '../db/schema.js';
import type { NewGameActionLogRow, NewSuspiciousEventRow } from '../db/schema.js';
import { validateMove as gameValidateMove } from './gameLogicService.js';
import type { Game, Move, ValidationResult } from '../shared/types.js';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const MIN_HUMAN_REACTION_MS = 800;
const SPEED_WINDOW_MOVES = 5;
const REPUTATION_PENALTY_INVALID = 5;
const REPUTATION_PENALTY_SPEED = 3;

export type Severity = 'low' | 'medium' | 'high';

export class AntiCheatService {
  async logAction(
    gameId: string,
    userId: string,
    actionType: string,
    payload: Record<string, unknown> = {},
    matchId?: string | null
  ): Promise<void> {
    const row: NewGameActionLogRow = {
      id: genId('log'),
      gameId,
      matchId: matchId ?? null,
      userId,
      actionType,
      actionPayload: payload,
    };
    await db.insert(gameActionLogs).values(row);
  }

  validateMove(game: Game, playerIndex: number, move: Move): ValidationResult {
    return gameValidateMove(game, playerIndex, move);
  }

  detectImpossibleMoves(game: Game, playerIndex: number, move: Move): string | null {
    const result = gameValidateMove(game, playerIndex, move);
    if (!result.valid) return result.error ?? 'Invalid move';
    return null;
  }

  async detectSpeedAbuse(userId: string): Promise<boolean> {
    const rows = await db
      .select({ createdAt: gameActionLogs.createdAt })
      .from(gameActionLogs)
      .where(and(eq(gameActionLogs.userId, userId), eq(gameActionLogs.actionType, 'move')))
      .orderBy(desc(gameActionLogs.createdAt))
      .limit(SPEED_WINDOW_MOVES + 1);

    if (rows.length < SPEED_WINDOW_MOVES) return false;
    const timestamps = rows.map((r) => r.createdAt.getTime()).reverse();
    let totalGap = 0;
    let count = 0;
    for (let i = 1; i < timestamps.length; i++) {
      totalGap += timestamps[i] - timestamps[i - 1];
      count++;
    }
    const avgMs = count > 0 ? totalGap / count : 0;
    return avgMs < MIN_HUMAN_REACTION_MS;
  }

  async detectCollusion(matchId: string, playerIds: string[]): Promise<boolean> {
    const rows = await db
      .select()
      .from(suspiciousEvents)
      .where(and(eq(suspiciousEvents.matchId, matchId), eq(suspiciousEvents.eventType, 'collusion')))
      .limit(1);
    return rows.length > 0;
  }

  async detectMultiAccount(userId: string, _ip?: string, _deviceId?: string): Promise<boolean> {
    // Placeholder: in production, compare IP/deviceId across users
    const rows = await db
      .select()
      .from(suspiciousEvents)
      .where(and(eq(suspiciousEvents.userId, userId), eq(suspiciousEvents.eventType, 'multi_account')))
      .limit(1);
    return rows.length > 0;
  }

  async recordSuspiciousEvent(
    userId: string,
    eventType: string,
    severity: Severity,
    details: Record<string, unknown> = {},
    gameId?: string | null,
    matchId?: string | null
  ): Promise<void> {
    const row: NewSuspiciousEventRow = {
      id: genId('susp'),
      userId,
      gameId: gameId ?? null,
      matchId: matchId ?? null,
      eventType,
      severity,
      details,
    };
    await db.insert(suspiciousEvents).values(row);
    await this.adjustReputation(userId, severity === 'high' ? -15 : severity === 'medium' ? -8 : -3);
  }

  private async adjustReputation(userId: string, delta: number): Promise<void> {
    const rows = await db
      .select()
      .from(userReputation)
      .where(eq(userReputation.userId, userId))
      .limit(1);
    const score = Math.max(0, Math.min(100, (rows[0]?.score ?? 100) + delta));
    if (rows.length > 0) {
      await db
        .update(userReputation)
        .set({ score, lastUpdated: new Date() })
        .where(eq(userReputation.userId, userId));
    } else {
      await db.insert(userReputation).values({
        userId,
        score,
        lastUpdated: new Date(),
      });
    }
  }

  async calculateReputation(userId: string): Promise<number> {
    const rows = await db
      .select({ score: userReputation.score })
      .from(userReputation)
      .where(eq(userReputation.userId, userId))
      .limit(1);
    return rows[0]?.score ?? 100;
  }

  async hasHighSeveritySuspiciousEvents(userId: string, matchId?: string | null): Promise<boolean> {
    const conditions = [
      eq(suspiciousEvents.userId, userId),
      eq(suspiciousEvents.severity, 'high'),
    ];
    if (matchId) conditions.push(eq(suspiciousEvents.matchId, matchId));
    const rows = await db
      .select()
      .from(suspiciousEvents)
      .where(and(...conditions))
      .limit(1);
    return rows.length > 0;
  }

  async isTournamentUnderReview(participantIds: string[]): Promise<boolean> {
    for (const userId of participantIds) {
      const flag = await this.hasHighSeverityForUser(userId);
      if (flag) return true;
    }
    return false;
  }

  async isMatchUnderReview(matchId: string): Promise<boolean> {
    const rows = await db
      .select({ player1Id: tournamentMatches.player1Id, player2Id: tournamentMatches.player2Id })
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, matchId))
      .limit(1);
    const m = rows[0];
    if (!m) return false;
    const playerIds = [m.player1Id, m.player2Id].filter(Boolean) as string[];
    for (const pid of playerIds) {
      const flag = await this.hasHighSeverityForUser(pid);
      if (flag) return true;
    }
    return false;
  }

  async hasHighSeverityForUser(userId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(suspiciousEvents)
      .where(
        and(eq(suspiciousEvents.userId, userId), eq(suspiciousEvents.severity, 'high'))
      )
      .limit(1);
    return rows.length > 0;
  }

  async listSuspiciousEvents(filters?: { userId?: string; severity?: Severity }): Promise<
    {
      id: string;
      userId: string;
      gameId: string | null;
      matchId: string | null;
      eventType: string;
      severity: string;
      details: Record<string, unknown>;
      createdAt: Date;
    }[]
  > {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(suspiciousEvents.userId, filters.userId));
    if (filters?.severity) conditions.push(eq(suspiciousEvents.severity, filters.severity));
    const rows = await db
      .select()
      .from(suspiciousEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(suspiciousEvents.createdAt))
      .limit(100);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      gameId: r.gameId,
      matchId: r.matchId,
      eventType: r.eventType,
      severity: r.severity,
      details: (r.details as Record<string, unknown>) ?? {},
      createdAt: r.createdAt,
    }));
  }

  async getUserAntiCheatSummary(userId: string): Promise<{
    reputation: number;
    suspiciousCount: number;
    recentEvents: { eventType: string; severity: string; createdAt: Date }[];
  }> {
    const rep = await this.calculateReputation(userId);
    const events = await this.listSuspiciousEvents({ userId });
    return {
      reputation: rep,
      suspiciousCount: events.length,
      recentEvents: events.slice(0, 10).map((e) => ({
        eventType: e.eventType,
        severity: e.severity,
        createdAt: e.createdAt,
      })),
    };
  }
}

export const antiCheatService = new AntiCheatService();
