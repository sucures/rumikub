import React from 'react';
import type { Player } from '../../../shared/types';

interface TurnIndicatorProps {
  currentPlayerIndex: number;
  players: Player[];
  myUserId: string | null;
}

export default function TurnIndicator({ currentPlayerIndex, players, myUserId }: TurnIndicatorProps) {
  const current = players[currentPlayerIndex];
  const isMyTurn = current && myUserId && current.userId === myUserId;
  return (
    <div
      className={`text-center py-3 px-4 sm:px-5 rounded-xl border transition-all duration-200 ${
        isMyTurn
          ? 'bg-amber-900/30 border-amber-500/60 animate-pulse-subtle'
          : 'bg-gray-700/50 border-gray-600/80'
      }`}
    >
      {isMyTurn ? (
        <span className="text-amber-400 font-semibold">Your turn</span>
      ) : current ? (
        <span className="text-gray-300">Waiting for {current.name}</span>
      ) : (
        <span className="text-gray-500">—</span>
      )}
    </div>
  );
}
