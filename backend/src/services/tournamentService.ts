// Tournament service (Step 17) — creation, joining, prize pool, chat
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  tournaments,
  tournamentEntries,
  tournamentRulesets,
  tournamentChatMessages,
  users,
} from '../db/schema.js';
import type { NewTournamentRow, NewTournamentRulesetRow, NewTournamentEntryRow, NewTournamentChatMessageRow } from '../db/schema.js';
import { tokenService } from './tokenService.js';
import { tournamentProgressionService } from './tournamentProgressionService.js';

const PLATFORM_FEE_PERCENT = 25;

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface TournamentRulesetInput {
  allowJokers: boolean;
  tilesPerPlayer: number;
  turnTimeSeconds: number;
  maxPlayers: number;
  customName?: string;
}

export interface CreateTournamentInput {
  name: string;
  maxPlayers: 2 | 4 | 6 | 8;
  entryFee: number;
  ruleset: TournamentRulesetInput;
  isPrivate?: boolean;
}

export interface TournamentWithDetails {
  id: string;
  creatorUserId: string;
  creatorUsername: string;
  name: string;
  status: string;
  maxPlayers: number;
  entryFee: number;
  prizePool: number;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  ruleset: {
    id: string;
    allowJokers: boolean;
    tilesPerPlayer: number;
    turnTimeSeconds: number;
    maxPlayers: number;
    customName?: string | null;
  } | null;
  participants: {
    userId: string;
    username: string;
    avatar?: string | null;
    paidEntryFee: number;
    joinedAt: Date;
  }[];
  participantCount: number;
}

export class TournamentService {
  async createTournament(creatorUserId: string, input: CreateTournamentInput): Promise<TournamentWithDetails> {
    const rulesetId = genId('ruleset');
    const rulesetRow: NewTournamentRulesetRow = {
      id: rulesetId,
      allowJokers: input.ruleset.allowJokers ?? true,
      tilesPerPlayer: input.ruleset.tilesPerPlayer ?? 14,
      turnTimeSeconds: input.ruleset.turnTimeSeconds ?? 60,
      maxPlayers: input.ruleset.maxPlayers ?? input.maxPlayers,
      customName: input.ruleset.customName ?? null,
    };
    await db.insert(tournamentRulesets).values(rulesetRow);

    const tournamentId = genId('t');
    const status = 'open';
    const tournamentRow: NewTournamentRow = {
      id: tournamentId,
      creatorUserId,
      name: input.name.trim() || 'Untitled Tournament',
      status,
      maxPlayers: input.maxPlayers,
      entryFee: Math.max(0, input.entryFee),
      prizePool: 0,
      rulesetId,
      isPrivate: Boolean(input.isPrivate),
    };
    await db.insert(tournaments).values(tournamentRow);

    return this.getTournamentWithDetails(tournamentId);
  }

  async getTournamentWithDetails(tournamentId: string): Promise<TournamentWithDetails | null> {
    const tRows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    const t = tRows[0];
    if (!t) return null;

    const creatorRows = await db.select({ username: users.username, avatar: users.avatar }).from(users).where(eq(users.id, t.creatorUserId)).limit(1);
    const creator = creatorRows[0];

    let rulesetRow = null;
    if (t.rulesetId) {
      const rs = await db.select().from(tournamentRulesets).where(eq(tournamentRulesets.id, t.rulesetId)).limit(1);
      rulesetRow = rs[0] ?? null;
    }

    const entries = await db
      .select({
        userId: tournamentEntries.userId,
        username: users.username,
        avatar: users.avatar,
        avatarUrl: users.avatarUrl,
        paidEntryFee: tournamentEntries.paidEntryFee,
        joinedAt: tournamentEntries.joinedAt,
      })
      .from(tournamentEntries)
      .innerJoin(users, eq(users.id, tournamentEntries.userId))
      .where(eq(tournamentEntries.tournamentId, tournamentId))
      .orderBy(tournamentEntries.joinedAt);

    return {
      id: t.id,
      creatorUserId: t.creatorUserId,
      creatorUsername: creator?.username ?? 'Unknown',
      name: t.name,
      status: t.status,
      maxPlayers: t.maxPlayers,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      isPrivate: t.isPrivate,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      ruleset: rulesetRow
        ? {
            id: rulesetRow.id,
            allowJokers: rulesetRow.allowJokers,
            tilesPerPlayer: rulesetRow.tilesPerPlayer,
            turnTimeSeconds: rulesetRow.turnTimeSeconds,
            maxPlayers: rulesetRow.maxPlayers,
            customName: rulesetRow.customName,
          }
        : null,
      participants: entries.map((e) => ({
        userId: e.userId,
        username: e.username,
        avatar: e.avatar,
        avatarUrl: (e as { avatarUrl?: string | null }).avatarUrl ?? null,
        paidEntryFee: e.paidEntryFee,
        joinedAt: e.joinedAt,
      })),
      participantCount: entries.length,
    };
  }

  async listTournaments(filters?: {
    status?: string;
    freeOnly?: boolean;
    premiumOnly?: boolean;
  }): Promise<TournamentWithDetails[]> {
    const conditions = [eq(tournaments.isPrivate, false)];
    if (filters?.status) conditions.push(eq(tournaments.status, filters.status));
    const rows = await db
      .select()
      .from(tournaments)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(tournaments.createdAt));

    const result: TournamentWithDetails[] = [];
    for (const t of rows) {
      if (filters?.freeOnly && t.entryFee > 0) continue;
      if (filters?.premiumOnly && t.entryFee === 0) continue;
      const details = await this.getTournamentWithDetails(t.id);
      if (details) result.push(details);
    }
    return result;
  }

  async joinTournament(tournamentId: string, userId: string): Promise<TournamentWithDetails> {
    const tRows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    const t = tRows[0];
    if (!t) throw new Error('Tournament not found');
    if (t.status !== 'open') throw new Error('Tournament is not open for registration');

    const entryCount = await db
      .select({ count: tournamentEntries.id })
      .from(tournamentEntries)
      .where(eq(tournamentEntries.tournamentId, tournamentId));
    if (entryCount.length >= t.maxPlayers) throw new Error('Tournament is full');

    const existing = await db
      .select()
      .from(tournamentEntries)
      .where(and(eq(tournamentEntries.tournamentId, tournamentId), eq(tournamentEntries.userId, userId)))
      .limit(1);
    if (existing.length > 0) throw new Error('Already joined');

    // Deduct entry fee via tokenService (records transaction)
    if (t.entryFee > 0) {
      await tokenService.spendCoins(userId, t.entryFee, `Tournament entry: ${t.name}`);
    }

    const entryId = genId('entry');
    const entryRow: NewTournamentEntryRow = {
      id: entryId,
      tournamentId,
      userId,
      paidEntryFee: t.entryFee,
    };
    await db.insert(tournamentEntries).values(entryRow);

    await db
      .update(tournaments)
      .set({
        prizePool: t.prizePool + t.entryFee,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, tournamentId));

    const details = await this.getTournamentWithDetails(tournamentId);
    if (!details) throw new Error('Failed to fetch tournament');
    return details;
  }

  async startTournament(tournamentId: string, userId: string): Promise<TournamentWithDetails> {
    const tRows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    const t = tRows[0];
    if (!t) throw new Error('Tournament not found');
    if (t.creatorUserId !== userId) throw new Error('Only the creator can start the tournament');
    if (t.status !== 'open') throw new Error('Tournament is not open for starting');

    const entries = await db.select().from(tournamentEntries).where(eq(tournamentEntries.tournamentId, tournamentId));
    if (entries.length < 2) throw new Error('Need at least 2 players to start');

    await tournamentProgressionService.startTournament(tournamentId);

    const details = await this.getTournamentWithDetails(tournamentId);
    if (!details) throw new Error('Failed to fetch tournament');
    return details;
  }

  async finishTournament(tournamentId: string, userId: string, winnerUserId?: string): Promise<TournamentWithDetails> {
    const tRows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    const t = tRows[0];
    if (!t) throw new Error('Tournament not found');
    if (t.creatorUserId !== userId) throw new Error('Only the creator can finish the tournament');
    if (t.status !== 'in_progress') throw new Error('Tournament is not in progress');

    if (winnerUserId && t.prizePool > 0) {
      const winnerPayout = Math.floor(t.prizePool * (1 - PLATFORM_FEE_PERCENT / 100));
      await tokenService.addCoins(winnerUserId, winnerPayout, `Tournament prize: ${t.name}`);
    }

    await db
      .update(tournaments)
      .set({ status: 'finished', updatedAt: new Date() })
      .where(eq(tournaments.id, tournamentId));

    const details = await this.getTournamentWithDetails(tournamentId);
    if (!details) throw new Error('Failed to fetch tournament');
    return details;
  }

  async getChatMessages(tournamentId: string, limit = 50): Promise<
    { id: string; userId: string; username: string; message: string; createdAt: Date }[]
  > {
    const rows = await db
      .select({
        id: tournamentChatMessages.id,
        userId: tournamentChatMessages.userId,
        username: users.username,
        message: tournamentChatMessages.message,
        createdAt: tournamentChatMessages.createdAt,
      })
      .from(tournamentChatMessages)
      .innerJoin(users, eq(users.id, tournamentChatMessages.userId))
      .where(eq(tournamentChatMessages.tournamentId, tournamentId))
      .orderBy(desc(tournamentChatMessages.createdAt))
      .limit(limit);

    return rows.reverse().map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      message: r.message,
      createdAt: r.createdAt,
    }));
  }

  async sendChatMessage(tournamentId: string, userId: string, message: string): Promise<{ id: string; createdAt: Date }> {
    const tRows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    if (!tRows[0]) throw new Error('Tournament not found');

    const msgId = genId('msg');
    const msgRow: NewTournamentChatMessageRow = {
      id: msgId,
      tournamentId,
      userId,
      message: String(message || '').trim().slice(0, 500),
    };
    await db.insert(tournamentChatMessages).values(msgRow);
    const rows = await db.select({ createdAt: tournamentChatMessages.createdAt }).from(tournamentChatMessages).where(eq(tournamentChatMessages.id, msgId)).limit(1);
    return { id: msgId, createdAt: rows[0]?.createdAt ?? new Date() };
  }

  async userIsPremium(userId: string): Promise<boolean> {
    const rows = await db.select({ premium: users.premium }).from(users).where(eq(users.id, userId)).limit(1);
    return rows[0]?.premium ?? false;
  }
}

export const tournamentService = new TournamentService();
