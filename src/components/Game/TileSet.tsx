import React from 'react';
import type { GameSet } from '../../../shared/types';
import Tile from '../Tile/Tile';

interface TileSetProps {
  set: GameSet;
  tileSize?: 'small' | 'medium' | 'large';
}

export default function TileSetComponent({ set, tileSize = 'medium' }: TileSetProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-gray-500 mr-1 uppercase">{set.type}</span>
      {set.tiles.map((tile) => (
        <Tile key={tile.id} tile={tile} size={tileSize} />
      ))}
    </div>
  );
}
