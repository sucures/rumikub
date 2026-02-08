// Tournament progression (Step 19) — matchmaking, rounds, bracket
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  tournaments,
  tournamentEntries,
  tournamentRounds,
  tournamentMatches,
  tournamentResults,
  users,
} from '../db/schema.js';
import type { NewTournamentRoundRow, NewTournamentMatchRow, NewTournamentResultRow } from '../db/schema.js';
import { tokenService } from './tokenService.js';
import { addTokens } from './walletService.js';
import { profileService } from './profileService.js';
import { antiCheatService } from './antiCheatService.js';
import { triggerTournamentStarting, triggerMatchReady } from './notificationTriggers.js';

const PLATFORM_FEE_PERCENT = 25;

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface MatchDto {
  id: string;
  tournamentId: string;
  roundNumber: number;
  tableNumber: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Username: string | null;
  player2Username: string | null;
  winnerId: string | null;
  winnerUsername: string | null;
  gameId: string | null;
  status: string;
  createdAt: Date;
}

export interface RoundDto {
  id: string;
  tournamentId: string;
  roundNumber: number;
  status: string;
  matches: MatchDto[];
  createdAt: Date;
}

export class TournamentProgressionService {
  async createMatchesForRound(tournamentId: string, roundNumber: number, playerIds: string[]): Promise<MatchDto[]> {
    const roundId = genId('round');
    const roundRow: NewTournamentRoundRow = {
      id: roundId,
      tournamentId,
      roundNumber,
      status: 'in_progress',
    };
    await db.insert(tournamentRounds).values(roundRow);

    const matches: MatchDto[] = [];
    let tableNumber = 1;

    for (let i = 0; i < playerIds.length; i += 2) {
      const p1 = playerIds[i];
      const p2 = playerIds[i + 1] ?? null;
      const matchId = genId('match');
      const matchRow: NewTournamentMatchRow = {
        id: matchId,
        tournamentId,
        roundNumber,
        tableNumber: tableNumber++,
        player1Id: p1,
        player2Id: p2,
        winnerId: p2 ? null : p1,
        status: p2 ? 'pending' : 'finished',
      };
      await db.insert(tournamentMatches).values(matchRow);
      const m = await this.getMatch(matchId);
      if (m) matches.push(m);

      for (const playerId of [p1, p2].filter(Boolean) as string[]) {
        triggerMatchReady(matchId, playerId, tournamentId, roundNumber).catch(() => {});
      }
    }

    return matches;
  }

  async getMatch(matchId: string): Promise<MatchDto | null> {
    const rows = await db.select().from(tournamentMatches).where(eq(tournamentMatches.id, matchId)).limit(1);
    const m = rows[0];
    if (!m) return null;

    const usernames: Record<string, string> = {};
    const ids = [m.player1Id, m.player2Id, m.winnerId].filter(Boolean) as string[];
    if (ids.length > 0) {
      const usersRows = await db.select({ id: users.id, username: users.username }).from(users);
      for (const u of usersRows) usernames[u.id] = u.username;
    }

    return {
      id: m.id,
      tournamentId: m.tournamentId,
      roundNumber: m.roundNumber,
      tableNumber: m.tableNumber,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      player1Username: m.player1Id ? (usernames[m.player1Id] ?? null) : null,
      player2Username: m.player2Id ? (usernames[m.player2Id] ?? null) : null,
      winnerId: m.winnerId,
      winnerUsername: m.winnerId ? (usernames[m.winnerId] ?? null) : null,
      gameId: m.gameId,
      status: m.status,
      createdAt: m.createdAt,
    };
  }

  async getMatchesForTournament(tournamentId: string): Promise<MatchDto[]> {
    const rows = await db.select().from(tournamentMatches).where(eq(tournamentMatches.tournamentId, tournamentId));
    const matches: MatchDto[] = [];
    for (const m of rows) {
      const dto = await this.getMatch(m.id);
      if (dto) matches.push(dto);
    }
    return matches.sort((a, b) => a.roundNumber - b.roundNumber || a.tableNumber - b.tableNumber);
  }

  async getRoundsForTournament(tournamentId: string): Promise<RoundDto[]> {
    const roundRows = await db.select().from(tournamentRounds).where(eq(tournamentRounds.tournamentId, tournamentId));
    const result: RoundDto[] = [];
    for (const r of roundRows.sort((a, b) => a.roundNumber - b.roundNumber)) {
      const matchRows = await db
        .select()
        .from(tournamentMatches)
        .where(and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.roundNumber, r.roundNumber)));
      const matches: MatchDto[] = [];
      for (const m of matchRows) {
        const dto = await this.getMatch(m.id);
        if (dto) matches.push(dto);
      }
      result.push({
        id: r.id,
        tournamentId: r.tournamentId,
        roundNumber: r.roundNumber,
        status: r.status,
        matches: matches.sort((a, b) => a.tableNumber - b.tableNumber),
        createdAt: r.createdAt,
      });
    }
    return result;
  }

  async reportWinner(matchId: string, winnerId: string): Promise<{ match: MatchDto; tournamentFinished?: boolean }> {
    const matchRows = await db.select().from(tournamentMatches).where(eq(tournamentMatches.id, matchId)).limit(1);
    const m = matchRows[0];
    if (!m) throw new Error('Match not found');
    if (m.status === 'finished') throw new Error('Match already finished');

    const validWinner =
      m.player1Id === winnerId || m.player2Id === winnerId || (m.player2Id === null && m.player1Id === winnerId);
    if (!validWinner) throw new Error('Winner must be one of the match players');

    await db
      .update(tournamentMatches)
      .set({ winnerId, status: 'finished', updatedAt: new Date() })
      .where(eq(tournamentMatches.id, matchId));

    await db
      .update(tournamentRounds)
      .set({ status: 'finished', updatedAt: new Date() })
      .where(
        and(
          eq(tournamentRounds.tournamentId, m.tournamentId),
          eq(tournamentRounds.roundNumber, m.roundNumber)
        )
      );

    const winners = await this.getWinnersForRound(m.tournamentId, m.roundNumber);
    const tRows = await db.select().from(tournaments).where(eq(tournaments.id, m.tournamentId)).limit(1);
    const t = tRows[0];
    if (!t) throw new Error('Tournament not found');

    if (winners.length === 1) {
      await this.finishTournament(m.tournamentId, winners[0]);
      const match = await this.getMatch(matchId);
      return { match: match!, tournamentFinished: true };
    }

    const allRoundMatches = await db
      .select()
      .from(tournamentMatches)
      .where(and(eq(tournamentMatches.tournamentId, m.tournamentId), eq(tournamentMatches.roundNumber, m.roundNumber)));
    const allFinished = allRoundMatches.every((x) => x.status === 'finished');
    if (!allFinished) {
      const match = await this.getMatch(matchId);
      return { match: match! };
    }

    const nextRoundNumber = m.roundNumber + 1;
    await this.createMatchesForRound(m.tournamentId, nextRoundNumber, winners);

    await db
      .update(tournamentRounds)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(
        and(eq(tournamentRounds.tournamentId, m.tournamentId), eq(tournamentRounds.roundNumber, nextRoundNumber))
      );

    const match = await this.getMatch(matchId);
    return { match: match! };
  }

  private async getWinnersForRound(tournamentId: string, roundNumber: number): Promise<string[]> {
    const rows = await db
      .select({ winnerId: tournamentMatches.winnerId })
      .from(tournamentMatches)
      .where(
        and(
          eq(tournamentMatches.tournamentId, tournamentId),
          eq(tournamentMatches.roundNumber, roundNumber)
        )
      );
    return rows.map((r) => r.winnerId).filter(Boolean) as string[];
  }

  private async finishTournament(tournamentId: string, winnerId: string): Promise<void> {
    const tRows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    const t = tRows[0];
    if (!t) return;

    const hasHighSeverity = await antiCheatService.hasHighSeverityForUser(winnerId);
    if (hasHighSeverity) {
      await antiCheatService.recordSuspiciousEvent(
        winnerId,
        'tournament_blocked',
        'high',
        { tournamentId, reason: 'High severity suspicious events - payout blocked' }
      );
      return;
    }

    const winnerPayout = Math.floor(t.prizePool * (1 - PLATFORM_FEE_PERCENT / 100));
    await tokenService.addCoins(winnerId, winnerPayout, `Tournament prize: ${t.name}`);
    await addTokens(winnerId, winnerPayout, { tournamentId }).catch(() => {});
    await profileService.incrementTournamentStats(winnerId, true);

    const resultId = genId('result');
    const resultRow: NewTournamentResultRow = {
      id: resultId,
      tournamentId,
      userId: winnerId,
      position: 1,
      rewardCoins: winnerPayout,
    };
    await db.insert(tournamentResults).values(resultRow);

    await db
      .update(tournaments)
      .set({ status: 'finished', updatedAt: new Date() })
      .where(eq(tournaments.id, tournamentId));
  }

  async startTournament(tournamentId: string): Promise<RoundDto[]> {
    const entries = await db
      .select({ userId: tournamentEntries.userId })
      .from(tournamentEntries)
      .where(eq(tournamentEntries.tournamentId, tournamentId));

    const playerIds = shuffle(entries.map((e) => e.userId));
    const matches = await this.createMatchesForRound(tournamentId, 1, playerIds);

    await db
      .update(tournaments)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(eq(tournaments.id, tournamentId));

    for (const playerId of playerIds) {
      triggerTournamentStarting(tournamentId, playerId).catch(() => {});
    }

    return this.getRoundsForTournament(tournamentId);
  }
}

export const tournamentProgressionService = new TournamentProgressionService();
