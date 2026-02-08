import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { Tile } from '../../../shared/types';
import SortableTile from '../Tile/SortableTile';
import { handTileId } from '../dnd/constants';

interface PlayerHandProps {
  tiles: Tile[];
  handOrder: string[];
  isMyTurn: boolean;
  gameId: string;
  selectedTileIds: Set<string>;
  tileIdsInPending: Set<string>;
  onToggleTile: (tileId: string) => void;
  onAddSelectedToPending: () => void;
  onHandReorder?: (tileIds: string[]) => void;
  onDraw: () => void;
  onEndTurn: () => void;
}

export default function PlayerHand({
  tiles,
  handOrder,
  isMyTurn,
  selectedTileIds,
  tileIdsInPending,
  onToggleTile,
  onAddSelectedToPending,
  onDraw,
  onEndTurn,
}: PlayerHandProps) {
  const canSelect = (tileId: string) => !tileIdsInPending.has(tileId);
  const addableCount = tiles.filter((t) => selectedTileIds.has(t.id) && canSelect(t.id)).length;

  const orderedTiles = React.useMemo(() => {
    const map = new Map(tiles.map((t) => [t.id, t]));
    return handOrder.map((id) => map.get(id)).filter(Boolean) as Tile[];
  }, [tiles, handOrder]);

  const sortableIds = React.useMemo(() => orderedTiles.map((t) => handTileId(t.id)), [orderedTiles]);

  const { setNodeRef, isOver } = useDroppable({ id: 'hand' });

  return (
    <div className="flex flex-col gap-2 p-4 sm:p-5 rounded-xl bg-gray-800/40 border border-gray-600/80 transition-all duration-200">
      <div
        ref={setNodeRef}
        className={`flex items-center gap-2 flex-wrap min-h-[3.5rem] rounded-xl p-2 transition-all duration-200 ${isOver ? 'bg-amber-900/25 ring-2 ring-amber-500/60 ring-offset-2 ring-offset-gray-800' : ''}`}
      >
        <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
          {orderedTiles.map((tile) => (
            <SortableTile
              key={tile.id}
              id={handTileId(tile.id)}
              tile={tile}
              size="medium"
              selected={selectedTileIds.has(tile.id)}
              onClick={isMyTurn && canSelect(tile.id) ? () => onToggleTile(tile.id) : undefined}
              disabled={!isMyTurn || tileIdsInPending.has(tile.id)}
            />
          ))}
        </SortableContext>
      </div>
      <div className="text-sm text-gray-400">
        {tiles.length} tile{tiles.length !== 1 ? 's' : ''}
        {tileIdsInPending.size > 0 && ` · ${tileIdsInPending.size} in pending`}
      </div>
      {isMyTurn && (
        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            type="button"
            onClick={onAddSelectedToPending}
            disabled={addableCount === 0}
            className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50 text-sm font-medium transition-all duration-150 active:scale-[0.98]"
          >
            Add to pending ({addableCount} selected)
          </button>
          <button
            type="button"
            onClick={onDraw}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 text-sm font-medium transition-all duration-150 active:scale-[0.98]"
          >
            Draw tile
          </button>
          <button
            type="button"
            onClick={onEndTurn}
            className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 text-sm font-medium transition-all duration-150 active:scale-[0.98]"
          >
            End turn
          </button>
        </div>
      )}
    </div>
  );
}
