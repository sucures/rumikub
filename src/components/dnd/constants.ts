/**
 * DnD Kit id conventions for game tiles.
 * Used to parse source/destination in onDragEnd.
 */

export const DND = {
  HAND: 'hand',
  HAND_TILE_PREFIX: 'hand-',
  PENDING_PREFIX: 'pending-',
  PENDING_TILE_PREFIX: 'pending-tile-',
  PENDING_SET_ROW_PREFIX: 'pending-set-',
  BOARD_PREFIX: 'board-',
  BOARD_TILE_PREFIX: 'board-tile-',
  BOARD_SET_ROW_PREFIX: 'board-set-',
  AVAILABLE_PREFIX: 'available-',
  POOL: 'board-pool',
} as const;

export function isHandId(id: string): boolean {
  return id === DND.HAND || id.startsWith(DND.HAND_TILE_PREFIX);
}

export function isPendingSetId(id: string): boolean {
  return id.startsWith(DND.PENDING_PREFIX) && !id.startsWith(DND.PENDING_TILE_PREFIX);
}

export function isPendingTileId(id: string): boolean {
  return id.startsWith(DND.PENDING_TILE_PREFIX);
}

export function isBoardId(id: string): boolean {
  return (id.startsWith(DND.BOARD_PREFIX) || id === DND.POOL) && !id.startsWith(DND.BOARD_TILE_PREFIX);
}

export function isBoardTileId(id: string): boolean {
  return id.startsWith(DND.BOARD_TILE_PREFIX);
}

/** hand-{tileId} */
export function handTileId(tileId: string): string {
  return `${DND.HAND_TILE_PREFIX}${tileId}`;
}

export function parseHandTileId(id: string): string | null {
  if (!id.startsWith(DND.HAND_TILE_PREFIX)) return null;
  return id.slice(DND.HAND_TILE_PREFIX.length);
}

/** pending-{setId} (droppable container). Sortable item: pending-tile::{setId}::{tileId} */
export function pendingSetId(setId: string): string {
  return `${DND.PENDING_PREFIX}${setId}`;
}

export function pendingTileId(setId: string, tileId: string): string {
  return `${DND.PENDING_TILE_PREFIX}${setId}::${tileId}`;
}

export function parsePendingTileId(id: string): { setId: string; tileId: string } | null {
  if (!id.startsWith(DND.PENDING_TILE_PREFIX)) return null;
  const rest = id.slice(DND.PENDING_TILE_PREFIX.length);
  const parts = rest.split('::');
  if (parts.length !== 2) return null;
  return { setId: parts[0], tileId: parts[1] };
}

/** board-{setId} (droppable). Sortable: board-tile::{setId}::{tileId} */
export function boardSetId(setId: string): string {
  return `${DND.BOARD_PREFIX}${setId}`;
}

export function boardTileId(setId: string, tileId: string): string {
  return `${DND.BOARD_TILE_PREFIX}${setId}::${tileId}`;
}

export function parseBoardTileId(id: string): { setId: string; tileId: string } | null {
  if (!id.startsWith(DND.BOARD_TILE_PREFIX)) return null;
  const rest = id.slice(DND.BOARD_TILE_PREFIX.length);
  const parts = rest.split('::');
  if (parts.length !== 2) return null;
  return { setId: parts[0], tileId: parts[1] };
}

/** available-{tileId} — tile in EditableBoard "Available to add" zone */
export function availableTileId(tileId: string): string {
  return `${DND.AVAILABLE_PREFIX}${tileId}`;
}

export function parseAvailableTileId(id: string): string | null {
  if (!id.startsWith(DND.AVAILABLE_PREFIX)) return null;
  return id.slice(DND.AVAILABLE_PREFIX.length);
}

/** pending-set-{setId} — sortable set row in PendingMeld */
export function pendingSetRowId(setId: string): string {
  return `${DND.PENDING_SET_ROW_PREFIX}${setId}`;
}

export function parsePendingSetRowId(id: string): string | null {
  if (!id.startsWith(DND.PENDING_SET_ROW_PREFIX)) return null;
  return id.slice(DND.PENDING_SET_ROW_PREFIX.length);
}

/** board-set-{setId} — sortable set row in EditableBoard */
export function boardSetRowId(setId: string): string {
  return `${DND.BOARD_SET_ROW_PREFIX}${setId}`;
}

export function parseBoardSetRowId(id: string): string | null {
  if (!id.startsWith(DND.BOARD_SET_ROW_PREFIX)) return null;
  return id.slice(DND.BOARD_SET_ROW_PREFIX.length);
}

export const AVAILABLE_ZONE = 'available-zone';
