// Daily motivation service (Step 31)
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { dailyMotivation, userMotivation } from '../db/schema.js';
import type { NewDailyMotivationRow, NewUserMotivationRow } from '../db/schema.js';
import { tournamentService } from './tournamentService.js';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayMotivation(userId: string): Promise<string> {
  const isPremium = await tournamentService.userIsPremium(userId);

  if (isPremium) {
    const rows = await db
      .select({ text: userMotivation.text })
      .from(userMotivation)
      .where(eq(userMotivation.userId, userId))
      .limit(1);
    if (rows.length > 0 && rows[0].text?.trim()) {
      return rows[0].text.trim();
    }
  }

  const today = todayString();
  const forToday = await db
    .select({ text: dailyMotivation.text })
    .from(dailyMotivation)
    .where(eq(dailyMotivation.date, today))
    .limit(1);

  if (forToday.length > 0) {
    return forToday[0].text;
  }

  await assignDailyMotivation();
  const afterAssign = await db
    .select({ text: dailyMotivation.text })
    .from(dailyMotivation)
    .where(eq(dailyMotivation.date, today))
    .limit(1);

  if (afterAssign.length > 0) {
    return afterAssign[0].text;
  }

  return 'Every game is a chance to improve. Play with intention.';
}

export async function setUserMotivation(userId: string, text: string): Promise<void> {
  const isPremium = await tournamentService.userIsPremium(userId);
  if (!isPremium) {
    throw new Error('Premium required to set custom motivation');
  }

  const trimmed = (text ?? '').trim();
  if (!trimmed) {
    throw new Error('Text cannot be empty');
  }

  const now = new Date();
  const existing = await db
    .select({ userId: userMotivation.userId })
    .from(userMotivation)
    .where(eq(userMotivation.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userMotivation)
      .set({ text: trimmed, updatedAt: now })
      .where(eq(userMotivation.userId, userId));
  } else {
    const row: NewUserMotivationRow = {
      userId,
      text: trimmed,
      updatedAt: now,
    };
    await db.insert(userMotivation).values(row);
  }
}

async function getRandomUnusedGlobalPhrase(): Promise<{ id: string; text: string } | null> {
  const rows = await db
    .select({ id: dailyMotivation.id, text: dailyMotivation.text })
    .from(dailyMotivation)
    .where(eq(dailyMotivation.used, false))
    .orderBy(sql`RANDOM()`)
    .limit(1);
  return rows.length > 0 ? { id: rows[0].id, text: rows[0].text } : null;
}

export async function assignDailyMotivation(): Promise<void> {
  const today = todayString();

  const existing = await db
    .select({ id: dailyMotivation.id })
    .from(dailyMotivation)
    .where(eq(dailyMotivation.date, today))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  const phrase = await getRandomUnusedGlobalPhrase();

  if (phrase) {
    await db
      .update(dailyMotivation)
      .set({ date: today, used: true })
      .where(eq(dailyMotivation.id, phrase.id));
    return;
  }

  const anyPhrase = await db
    .select({ id: dailyMotivation.id })
    .from(dailyMotivation)
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (anyPhrase.length > 0) {
    await db
      .update(dailyMotivation)
      .set({ date: today })
      .where(eq(dailyMotivation.id, anyPhrase[0].id));
  } else {
    const newRow: NewDailyMotivationRow = {
      id: genId('dm'),
      text: 'Every game is a chance to improve. Play with intention.',
      date: today,
      used: true,
    };
    await db.insert(dailyMotivation).values(newRow);
  }
}
