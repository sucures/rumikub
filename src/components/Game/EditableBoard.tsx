import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GameSet, Tile } from '../../../shared/types';
import SortableTile from '../Tile/SortableTile';
import DraggableTile from '../Tile/DraggableTile';
import { boardSetId, boardTileId, boardSetRowId, AVAILABLE_ZONE, availableTileId } from '../dnd/constants';
import DropIndicator from '../dnd/DropIndicator';

function EditableSetRow({
  set,
  disabled,
  onRemoveFromSet,
  onAddToSet,
}: {
  set: GameSet;
  disabled?: boolean;
  onRemoveFromSet: (setId: string, tileId: string) => void;
  onAddToSet: (setId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: boardSetId(set.id) });
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSetDragging,
  } = useSortable({
    id: boardSetRowId(set.id),
    data: { type: 'set-row', setId: set.id },
  });
  const sortableIds = set.tiles.map((t) => boardTileId(set.id, t.id));
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
            id={boardTileId(set.id, tile.id)}
            tile={tile}
            size="small"
            disabled={disabled}
            onRemove={!disabled ? () => onRemoveFromSet(set.id, tile.id) : undefined}
          />
        ))}
      </SortableContext>
      {set.tiles.length === 0 && <DropIndicator isOver={isOver} className="min-w-[2.25rem]" />}
      {!disabled && (
        <button
          type="button"
          className="px-2 py-1.5 rounded-lg bg-gray-600 text-xs font-medium text-gray-300 hover:bg-gray-500 transition-all duration-150"
          onClick={(e) => { e.stopPropagation(); onAddToSet(set.id); }}
        >
          Add here
        </button>
      )}
    </div>
  );
}

interface EditableBoardProps {
  workingBoard: GameSet[];
  editPool: Tile[];
  handTiles: Tile[];
  tilesInWorkingBoard: Set<string>;
  selectedTileId: string | null;
  onRemoveFromSet: (setId: string, tileId: string) => void;
  onSelectTileForAdd: (tileId: string) => void;
  onAddToSet: (setId: string) => void;
  onReorderSets?: (setIds: string[]) => void;
  onSubmitBoard: () => void;
  onCancelEdit: () => void;
  disabled?: boolean;
  submitDisabled?: boolean;
}

export default function EditableBoard({
  workingBoard,
  editPool,
  handTiles,
  tilesInWorkingBoard,
  selectedTileId,
  onRemoveFromSet,
  onSelectTileForAdd,
  onAddToSet,
  onReorderSets,
  onSubmitBoard,
  onCancelEdit,
  disabled,
  submitDisabled,
}: EditableBoardProps) {
  const availableToAdd = [
    ...editPool,
    ...handTiles.filter((t) => !tilesInWorkingBoard.has(t.id)),
  ];
  const setRowIds = workingBoard.map((s) => boardSetRowId(s.id));
  const { setNodeRef: availableRef, isOver: isAvailableOver } = useDroppable({ id: AVAILABLE_ZONE });

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-gray-700/40 border border-amber-600/50 transition-all duration-200">
      <h4 className="text-sm font-medium text-amber-400">Edit board (rearrange / add from hand)</h4>
      <SortableContext items={setRowIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {workingBoard.map((set) => (
            <EditableSetRow
              key={set.id}
              set={set}
              disabled={disabled}
              onRemoveFromSet={onRemoveFromSet}
              onAddToSet={onAddToSet}
            />
          ))}
        </div>
      </SortableContext>
      <div
        ref={availableRef}
        className={`flex flex-wrap gap-1 items-center min-h-[2.5rem] p-2 rounded-lg transition-colors duration-150 ${
          isAvailableOver ? 'bg-amber-900/20 ring-1 ring-amber-500/50' : ''
        }`}
      >
        <span className="text-xs text-gray-400 mr-1">Available to add:</span>
        {availableToAdd.map((tile) => (
          <DraggableTile
            key={tile.id}
            id={availableTileId(tile.id)}
            tile={tile}
            size="small"
            selected={selectedTileId === tile.id}
            onClick={!disabled ? () => onSelectTileForAdd(tile.id) : undefined}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmitBoard}
          disabled={disabled || submitDisabled}
          className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
        >
          Submit board
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="px-4 py-2 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-500 transition-all duration-150 active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
