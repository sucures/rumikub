import React from 'react';
import type { Tile as TileType } from '../../../shared/types';

const colorMap: Record<string, string> = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  yellow: 'bg-yellow-400 text-gray-900',
  black: 'bg-gray-800 text-white',
};

interface TileProps {
  tile: TileType;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export default function Tile({ tile, size = 'medium', selected, onClick, disabled }: TileProps) {
  const sizeClasses = {
    small: 'w-9 h-12 text-xs',
    medium: 'w-11 h-14 text-sm',
    large: 'w-14 h-16 text-base',
  };
  const colorClass = tile.isJoker ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : colorMap[tile.color] ?? 'bg-gray-500';
  const ringClass = selected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-900' : '';
  const clickableClass = onClick && !disabled ? 'cursor-pointer hover:opacity-90' : '';
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      className={`inline-flex items-center justify-center rounded font-bold border border-gray-700 ${sizeClasses[size]} ${colorClass} ${ringClass} ${clickableClass} ${disabled ? 'opacity-50' : ''}`}
      title={tile.isJoker ? 'Joker' : `${tile.value} ${tile.color}`}
      onClick={onClick && !disabled ? onClick : undefined}
      onKeyDown={onClick && !disabled ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {tile.isJoker ? '★' : tile.value}
    </div>
  );
}
