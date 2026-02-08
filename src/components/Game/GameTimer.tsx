import React, { useState, useEffect } from 'react';

interface GameTimerProps {
  /** Seconds allowed per move (e.g. 30). */
  timeLimitSeconds: number;
  /** True when it is the current user's turn. */
  isMyTurn: boolean;
  /** Timestamp (ms) when the current turn started. */
  turnStartTime: number | null;
  /** Called when countdown reaches 0 (optional, e.g. auto end turn). */
  onTimeUp?: () => void;
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, Math.floor(seconds % 60));
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GameTimer({
  timeLimitSeconds,
  isMyTurn,
  turnStartTime,
  onTimeUp,
}: GameTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!isMyTurn || turnStartTime === null) {
      setRemaining(null);
      return;
    }
    const start = turnStartTime;
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const r = Math.max(0, timeLimitSeconds - elapsed);
      setRemaining(r);
      if (r <= 0 && onTimeUp) {
        onTimeUp();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isMyTurn, turnStartTime, timeLimitSeconds, onTimeUp]);

  if (timeLimitSeconds <= 0) return null;

  const display = remaining !== null ? formatSeconds(remaining) : '—';
  const isLow = remaining !== null && remaining <= 10 && remaining > 0;
  const isZero = remaining !== null && remaining <= 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-mono transition-all duration-200 ${
        isZero
          ? 'bg-red-900/50 text-red-300 border border-red-700/50'
          : isLow
            ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50 animate-pulse-subtle'
            : 'bg-gray-700/50 text-gray-300 border border-gray-600/50'
      }`}
      title="Time per move"
    >
      <span aria-hidden>⏱</span>
      <span className="tabular-nums">{display}</span>
    </div>
  );
}
