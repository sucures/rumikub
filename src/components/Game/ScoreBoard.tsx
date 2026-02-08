import React from 'react';
import type { Player } from '../../../shared/types';

interface ScoreBoardProps {
  players: Player[];
  currentPlayerIndex: number;
}

export default function ScoreBoard({ players, currentPlayerIndex }: ScoreBoardProps) {
  return (
    <div className="rounded-xl border border-gray-600/80 bg-gray-800/50 p-4 sm:p-5 min-w-[140px] sm:min-w-[160px] transition-all duration-200">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Players</h3>
      <ul className="space-y-2">
        {players.map((p, i) => (
          <li
            key={p.id}
            className={`text-sm flex justify-between items-center gap-3 py-1 px-2 -mx-2 rounded-lg transition-colors duration-150 ${
              i === currentPlayerIndex ? 'text-amber-400 font-medium bg-amber-900/20' : 'text-gray-400'
            }`}
          >
            <span className="truncate">{p.name}</span>
            <span className="tabular-nums shrink-0">{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
