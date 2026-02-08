import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tile as TileType } from '../../../shared/types';
import Tile from './Tile';

interface SortableTileProps {
  id: string;
  tile: TileType;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
  /** Optional remove button (e.g. for pending/board) */
  onRemove?: () => void;
}

/**
 * A tile in a sortable list (hand, pending set, board set).
 * Supports reorder and optional remove button.
 */
export default function SortableTile({
  id,
  tile,
  size = 'medium',
  disabled,
  selected,
  onClick,
  onRemove,
}: SortableTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: 'tile', tile, tileId: tile.id },
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
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
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-xs leading-none opacity-0 group-hover:opacity-100 z-10"
          aria-label="Remove tile"
        >
          ×
        </button>
      )}
    </div>
  );
}
