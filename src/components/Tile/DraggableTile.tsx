import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Tile as TileType } from '../../../shared/types';
import Tile from './Tile';

interface DraggableTileProps {
  id: string;
  tile: TileType;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * A tile that can be dragged (use inside DndContext).
 * Keeps click handler for accessibility / fallback.
 */
export default function DraggableTile({
  id,
  tile,
  size = 'medium',
  disabled,
  selected,
  onClick,
}: DraggableTileProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: 'tile', tile, tileId: tile.id },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${isDragging ? 'opacity-40' : ''} ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
      {...listeners}
      {...attributes}
    >
      <Tile
        tile={tile}
        size={size}
        selected={selected}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      />
    </div>
  );
}
