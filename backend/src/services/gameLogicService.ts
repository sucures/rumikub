/**
 * Rummikub game logic engine.
 * Authoritative for: deck, deal, set/board validation, moves, scoring, win condition.
 */
import type {
  Color,
  TileValue,
  Tile,
  GameSet,
  Game,
  Player,
  Move,
  ValidationResult,
} from '../../../shared/types';

const COLORS: Color[] = ['red', 'blue', 'yellow', 'black'];
const VALUES: TileValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const TILE_COPIES_PER_COLOR = 2;
const JOKER_COUNT = 2;
const MIN_FIRST_MELD_SCORE = 30;
const JOKER_PENALTY = 30;

let tileIdCounter = 0;
function nextTileId(): string {
  return `tile_${Date.now()}_${++tileIdCounter}`;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Create a full Rummikub deck: 2× (1–13) per color × 4 colors + 2 jokers = 106 tiles.
 */
export function createDeck(): Tile[] {
  const tiles: Tile[] = [];
  for (const color of COLORS) {
    for (let copy = 0; copy < TILE_COPIES_PER_COLOR; copy++) {
      for (const value of VALUES) {
        tiles.push({
          id: nextTileId(),
          value,
          color,
          isJoker: false,
        });
      }
    }
  }
  for (let i = 0; i < JOKER_COUNT; i++) {
    tiles.push({
      id: nextTileId(),
      value: 1, // placeholder
      color: 'red', // placeholder
      isJoker: true,
    });
  }
  return shuffle(tiles);
}

/**
 * Deal tiles from the pool to each player. Mutates pool and players in place and returns them.
 */
export function deal(
  pool: Tile[],
  players: Player[],
  tilesPerPlayer: number
): { pool: Tile[]; players: Player[] } {
  const newPool = [...pool];
  const newPlayers = players.map((p) => ({ ...p, tiles: [...p.tiles] }));

  for (let i = 0; i < tilesPerPlayer; i++) {
    for (let j = 0; j < newPlayers.length; j++) {
      if (newPool.length === 0) break;
      const tile = newPool.pop()!;
      newPlayers[j].tiles.push(tile);
    }
  }

  return { pool: newPool, players: newPlayers };
}

/**
 * Value of a tile for scoring (joker = 0 when used in first-meld sum).
 */
function tileScore(t: Tile): number {
  return t.isJoker ? 0 : t.value;
}

/**
 * Penalty for a tile left in hand at end of game (joker = JOKER_PENALTY).
 */
function tilePenalty(t: Tile): number {
  return t.isJoker ? JOKER_PENALTY : t.value;
}

/**
 * Validate a single set (run or group).
 */
export function validateSet(set: GameSet): boolean {
  if (!set.tiles || set.tiles.length < 3) return false;

  const jokers = set.tiles.filter((t) => t.isJoker);
  const rest = set.tiles.filter((t) => !t.isJoker);

  if (set.type === 'run') {
    if (rest.length === 0) return jokers.length >= 3; // all jokers: invalid in standard rules
    const color = rest[0].color;
    if (rest.some((t) => t.color !== color)) return false;
    const values = rest.map((t) => t.value).sort((a, b) => a - b);
    const unique = [...new Set(values)];
    if (unique.length !== values.length) return false; // duplicate values
    const span = Math.max(...values) - Math.min(...values) + 1;
    const gaps = span - values.length;
    return gaps <= jokers.length;
  }

  if (set.type === 'group') {
    if (set.tiles.length > 4) return false;
    if (rest.length === 0) return false;
    const value = rest[0].value;
    if (rest.some((t) => t.value !== value)) return false;
    const colors = new Set(rest.map((t) => t.color));
    if (colors.size !== rest.length) return false; // duplicate color
    return rest.length + jokers.length <= 4;
  }

  return false;
}

/**
 * Validate entire board: every set valid and no duplicate tile ids.
 */
export function validateBoard(board: GameSet[]): boolean {
  const allIds: string[] = [];
  for (const set of board) {
    if (!validateSet(set)) return false;
    for (const t of set.tiles) {
      allIds.push(t.id);
    }
  }
  return new Set(allIds).size === allIds.length;
}

/**
 * Validate first meld: all sets valid and total value >= minScore (jokers count as 0).
 */
export function validateFirstMeld(
  sets: GameSet[],
  minScore: number = MIN_FIRST_MELD_SCORE
): boolean {
  if (!validateBoard(sets)) return false;
  let sum = 0;
  for (const set of sets) {
    for (const t of set.tiles) {
      sum += tileScore(t);
    }
  }
  return sum >= minScore;
}

/**
 * Deep clone game for immutable updates.
 */
function cloneGame(game: Game): Game {
  return {
    ...game,
    players: game.players.map((p) => ({
      ...p,
      tiles: p.tiles.map((t) => ({ ...t })),
    })),
    pool: game.pool.map((t) => ({ ...t })),
    board: game.board.map((s) => ({
      ...s,
      tiles: s.tiles.map((t) => ({ ...t })),
    })),
  };
}

/**
 * Get tile ids in a list of sets.
 */
function tileIdsInSets(sets: GameSet[]): Set<string> {
  const ids = new Set<string>();
  for (const set of sets) {
    for (const t of set.tiles) ids.add(t.id);
  }
  return ids;
}

/**
 * Validate and apply a move. Returns validation result with updated game on success.
 */
export function validateMove(
  game: Game,
  playerIndex: number,
  move: Move,
  minFirstMeldScore: number = MIN_FIRST_MELD_SCORE
): ValidationResult {
  if (game.status !== 'playing') {
    return { valid: false, error: 'Game is not in progress' };
  }
  if (playerIndex < 0 || playerIndex >= game.players.length) {
    return { valid: false, error: 'Invalid player' };
  }
  if (game.currentPlayerIndex !== playerIndex) {
    return { valid: false, error: 'Not your turn' };
  }

  const player = game.players[playerIndex];
  const handIds = new Set(player.tiles.map((t) => t.id));
  const boardIds = tileIdsInSets(game.board);

  if (move.type === 'meld') {
    if (!move.sets || move.sets.length === 0) {
      return { valid: false, error: 'Meld must include at least one set' };
    }
    const meldIds = tileIdsInSets(move.sets);
    for (const id of meldIds) {
      if (!handIds.has(id)) {
        return { valid: false, error: 'All meld tiles must come from your hand' };
      }
    }
    const newBoard = [...game.board, ...move.sets];
    if (!validateBoard(newBoard)) {
      return { valid: false, error: 'Invalid sets on board' };
    }
    if (!player.hasMadeInitialMeld) {
      if (!validateFirstMeld(move.sets, minFirstMeldScore)) {
        return {
          valid: false,
          error: `First meld must total at least ${minFirstMeldScore} points`,
        };
      }
    }
    const newGame = applyMove(cloneGame(game), playerIndex, move);
    return { valid: true, game: newGame };
  }

  if (move.type === 'manipulate') {
    if (!move.sets || move.sets.length === 0) {
      return { valid: false, error: 'Board cannot be empty after manipulate' };
    }
    if (!player.hasMadeInitialMeld) {
      return { valid: false, error: 'You must place a first meld before rearranging' };
    }
    const newBoardIds = tileIdsInSets(move.sets);
    for (const id of newBoardIds) {
      if (!boardIds.has(id) && !handIds.has(id)) {
        return { valid: false, error: 'All board tiles must come from current board or your hand' };
      }
    }
    const idsOnlyOnNewBoard = new Set<string>();
    for (const id of newBoardIds) {
      if (!boardIds.has(id)) idsOnlyOnNewBoard.add(id);
    }
    for (const id of idsOnlyOnNewBoard) {
      if (!handIds.has(id)) {
        return { valid: false, error: 'Tiles added to board must come from your hand' };
      }
    }
    if (!validateBoard(move.sets)) {
      return { valid: false, error: 'Invalid board after rearrange' };
    }
    const newGame = applyMove(cloneGame(game), playerIndex, move);
    return { valid: true, game: newGame };
  }

  if (move.type === 'draw') {
    if (game.pool.length === 0) {
      return { valid: false, error: 'Pool is empty' };
    }
    const newGame = applyMove(cloneGame(game), playerIndex, move);
    return { valid: true, game: newGame };
  }

  if (move.type === 'end_turn') {
    const newGame = applyMove(cloneGame(game), playerIndex, move);
    return { valid: true, game: newGame };
  }

  return { valid: false, error: 'Unknown move type' };
}

/**
 * Apply a move to a game (immutable). Assumes move has been validated.
 */
export function applyMove(game: Game, playerIndex: number, move: Move): Game {
  const g = cloneGame(game);
  const player = g.players[playerIndex];

  if (move.type === 'meld' && move.sets && move.sets.length > 0) {
    const meldIds = tileIdsInSets(move.sets);
    player.tiles = player.tiles.filter((t) => !meldIds.has(t.id));
    g.board = [...g.board, ...move.sets];
    player.hasMadeInitialMeld = true;
    return g;
  }

  if (move.type === 'manipulate' && move.sets) {
    const boardIds = tileIdsInSets(g.board);
    const newBoardIds = tileIdsInSets(move.sets);
    const fromHand = new Set<string>();
    for (const id of newBoardIds) {
      if (!boardIds.has(id)) fromHand.add(id);
    }
    player.tiles = player.tiles.filter((t) => !fromHand.has(t.id));
    g.board = move.sets.map((s) => ({ ...s, tiles: s.tiles.map((t) => ({ ...t })) }));
    return g;
  }

  if (move.type === 'draw' && g.pool.length > 0) {
    const tile = g.pool.pop()!;
    player.tiles.push(tile);
    return g;
  }

  if (move.type === 'end_turn') {
    g.currentPlayerIndex = (g.currentPlayerIndex + 1) % g.players.length;
    return g;
  }

  return g;
}

/**
 * Check if a player has won (empty hand).
 */
export function checkWin(player: Player): boolean {
  return player.tiles.length === 0;
}

/**
 * Compute score deltas at end of game. Winner gets sum of all penalties; each loser gets minus their penalty.
 * Returns map of playerId -> score delta (winner positive, losers negative).
 */
export function computeScores(
  game: Game,
  winnerIndex: number
): Record<string, number> {
  const result: Record<string, number> = {};
  let totalPenalty = 0;

  for (let i = 0; i < game.players.length; i++) {
    if (i === winnerIndex) continue;
    const p = game.players[i];
    const penalty = p.tiles.reduce((sum, t) => sum + tilePenalty(t), 0);
    result[p.userId] = -penalty;
    totalPenalty += penalty;
  }

  result[game.players[winnerIndex].userId] = totalPenalty;
  return result;
}

export const gameLogicService = {
  createDeck,
  deal,
  validateSet,
  validateBoard,
  validateFirstMeld,
  validateMove,
  applyMove,
  checkWin,
  computeScores,
  MIN_FIRST_MELD_SCORE,
  JOKER_PENALTY,
};
