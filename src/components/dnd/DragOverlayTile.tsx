import React from 'react';
import type { Tile as TileType } from '../../../shared/types';
import Tile from '../Tile/Tile';

interface DragOverlayTileProps {
  tile: TileType;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Tile rendered inside DragOverlay for visual feedback while dragging.
 * Slightly scaled, shadow, and ring for a "lifted" effect with visual snapping feedback.
 */
export default function DragOverlayTile({ tile, size = 'medium' }: DragOverlayTileProps) {
  return (
    <div className="cursor-grabbing scale-110 shadow-2xl ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-900 rounded -rotate-1 transition-transform duration-75 ease-out">
      <Tile tile={tile} size={size} />
    </div>
  );
}
