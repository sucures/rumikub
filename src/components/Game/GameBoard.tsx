import React from 'react';
import type { GameSet } from '../../../shared/types';
import type { CosmeticItem } from '../../api/marketplace';
import TileSet from './TileSet';

interface GameBoardProps {
  board: GameSet[];
  loadoutItems?: Record<string, CosmeticItem | null>;
}

export default function GameBoard({ board, loadoutItems = {} }: GameBoardProps) {
  const boardItem = Object.values(loadoutItems).find((i) => i?.type === 'board');
  const boardColor = (boardItem?.metadata?.color as string) || undefined;
  const boardTheme = (boardItem?.metadata?.theme as string) || undefined;
  const boardStyle = boardColor
    ? { backgroundColor: boardColor + '40', borderColor: boardColor + '80' }
    : undefined;

  if (!board || board.length === 0) {
    return (
      <div
        className="min-h-[160px] flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-600/80 bg-gray-800/30 p-8 sm:p-10 transition-all duration-200 animate-fade-in"
        style={boardStyle}
      >
        <div
          className="w-14 h-14 rounded-xl bg-gray-700/50 flex items-center justify-center text-2xl text-gray-500/90"
          aria-hidden
        >
          📋
        </div>
        <p className="text-gray-400 text-sm sm:text-base text-center max-w-xs leading-relaxed">
          Board is empty — play a meld from your hand to start
        </p>
      </div>
    );
  }
  return (
    <div
      className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl border transition-all duration-200"
      style={
        boardStyle ?? {
          backgroundColor: 'rgba(22, 101, 52, 0.2)',
          borderColor: 'rgba(22, 101, 52, 0.4)',
        }
      }
    >
      {board.map((set) => (
        <TileSet key={set.id} set={set} />
      ))}
    </div>
  );
}
