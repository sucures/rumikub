/**
 * Client-side set validation for UX (e.g. enabling "Play meld").
 * Server remains authoritative.
 */
import type { Tile, GameSet } from '../../shared/types';

function isRun(tiles: Tile[]): boolean {
  if (tiles.length < 3) return false;
  const rest = tiles.filter((t) => !t.isJoker);
  const jokers = tiles.length - rest.length;
  if (rest.length === 0) return jokers >= 3;
  const color = rest[0].color;
  if (rest.some((t) => t.color !== color)) return false;
  const values = rest.map((t) => t.value).sort((a, b) => a - b);
  const unique = [...new Set(values)];
  if (unique.length !== values.length) return false;
  const span = Math.max(...values) - Math.min(...values) + 1;
  const gaps = span - values.length;
  return gaps <= jokers;
}

function isGroup(tiles: Tile[]): boolean {
  if (tiles.length < 3 || tiles.length > 4) return false;
  const rest = tiles.filter((t) => !t.isJoker);
  if (rest.length === 0) return false;
  const value = rest[0].value;
  if (rest.some((t) => t.value !== value)) return false;
  const colors = new Set(rest.map((t) => t.color));
  return colors.size === rest.length && rest.length + (tiles.length - rest.length) <= 4;
}

export function inferSetType(tiles: Tile[]): 'run' | 'group' | null {
  if (tiles.length < 3) return null;
  if (isRun(tiles)) return 'run';
  if (isGroup(tiles)) return 'group';
  return null;
}

export function isValidSet(tiles: Tile[]): boolean {
  return inferSetType(tiles) !== null;
}

export function buildGameSet(id: string, tiles: Tile[], type: 'run' | 'group'): GameSet {
  return { id, tiles: [...tiles], type };
}

/** Generate a temporary set id for pending meld */
export function tempSetId(): string {
  return `set_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
