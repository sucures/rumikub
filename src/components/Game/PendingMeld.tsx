import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GameSet } from '../../../shared/types';
import SortableTile from '../Tile/SortableTile';
import { pendingSetId, pendingTileId, pendingSetRowId } from '../dnd/constants';
import { isValidSet } from '../../utils/setValidation';
import DropIndicator from '../dnd/DropIndicator';

function PendingSetRow({
  set,
  disabled,
  onRemoveTile,
}: {
  set: GameSet;
  disabled?: boolean;
  onRemoveTile: (setId: string, tileId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: pendingSetId(set.id) });
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSetDragging,
  } = useSortable({
    id: pendingSetRowId(set.id),
    data: { type: 'set-row', setId: set.id },
  });
  const sortableIds = set.tiles.map((t) => pendingTileId(set.id, t.id));
  const style = { transform: CSS.Transform.toString(transform), transition };

  const setRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setSortableRef(node);
  };

  return (
    <div
      ref={setRef}
      style={style}
      className={`flex flex-wrap items-center gap-1 p-2 rounded-lg min-h-[2.5rem] transition-colors duration-150 ${
        isOver ? 'bg-amber-900/30 ring-1 ring-amber-500/50' : 'bg-gray-800/50'
      } ${isSetDragging ? 'opacity-60' : ''}`}
      {...(!disabled ? attributes : {})}
      {...(!disabled ? listeners : {})}
    >
      <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
        {set.tiles.map((tile) => (
          <SortableTile
            key={tile.id}
            id={pendingTileId(set.id, tile.id)}
            tile={tile}
            size="small"
            disabled={disabled}
            onRemove={!disabled ? () => onRemoveTile(set.id, tile.id) : undefined}
          />
        ))}
      </SortableContext>
      {set.tiles.length === 0 && <DropIndicator isOver={isOver} className="min-w-[2.25rem]" />}
    </div>
  );
}

interface PendingMeldProps {
  sets: GameSet[];
  onRemoveTile: (setId: string, tileId: string) => void;
  onReorderSets?: (setIds: string[]) => void;
  onPlayMeld: () => void;
  onNewSet: () => void;
  disabled?: boolean;
  isMyTurn?: boolean;
}

export default function PendingMeld({
  sets,
  onRemoveTile,
  onReorderSets,
  onPlayMeld,
  onNewSet,
  disabled,
}: PendingMeldProps) {
  const allValid = sets.length > 0 && sets.every((s) => s.tiles.length >= 3 && isValidSet(s.tiles));
  const hasTiles = sets.some((s) => s.tiles.length > 0);
  const setRowIds = sets.map((s) => pendingSetRowId(s.id));

  return (
    <div className="flex flex-col gap-2 p-4 sm:p-5 rounded-xl bg-gray-700/40 border border-gray-600/80 transition-all duration-200">
      <h4 className="text-sm font-medium text-gray-300">Pending meld</h4>
      <SortableContext items={setRowIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-wrap gap-3 items-start">
          {sets.map((set) => (
            <PendingSetRow
              key={set.id}
              set={set}
            disabled={disabled}
            onRemoveTile={onRemoveTile}
          />
        ))}
        </div>
      </SortableContext>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onNewSet}
          disabled={disabled}
          className="px-4 py-2 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-500 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
        >
          New set
        </button>
        <button
          type="button"
          onClick={onPlayMeld}
          disabled={disabled || !allValid || !hasTiles}
          className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
        >
          Play meld
        </button>
      </div>
      {sets.some((s) => s.tiles.length > 0 && s.tiles.length < 3) && (
        <p className="text-xs text-amber-500">Each set needs at least 3 tiles (run or group).</p>
      )}
    </div>
  );
}
