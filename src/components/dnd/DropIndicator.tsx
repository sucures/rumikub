import React from 'react';

interface DropIndicatorProps {
  isOver: boolean;
  isInvalid?: boolean;
  className?: string;
}

/**
 * Visual drop indicator for droppable zones (snapping / drop target feedback).
 * Animated scale and pulse for clear visual snapping feedback.
 */
export default function DropIndicator({ isOver, isInvalid, className = '' }: DropIndicatorProps) {
  if (!isOver) return null;
  return (
    <div
      className={`rounded border-2 border-dashed transition-all duration-150 ease-out min-h-[2rem] animate-pulse ${className} ${
        isInvalid ? 'border-red-500 bg-red-500/20 scale-105' : 'border-amber-400 bg-amber-500/30 scale-105'
      }`}
      aria-hidden
    />
  );
}
