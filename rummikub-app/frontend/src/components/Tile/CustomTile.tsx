import React from 'react';
import { Tile as TileType } from '../../../shared/types';
import { TileColorScheme, TileDesign } from '../../../shared/themeTypes';

interface CustomTileProps {
  tile: TileType;
  colors: TileColorScheme;
  design: TileDesign;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  selected?: boolean;
}

const designClasses: Record<TileDesign, string> = {
  standard: 'rounded-lg',
  rounded: 'rounded-xl',
  sharp: 'rounded-sm',
  glossy: 'rounded-lg shadow-lg bg-gradient-to-br from-white/20 to-transparent',
  matte: 'rounded-lg shadow-md',
  neon_glow: 'rounded-lg shadow-lg shadow-current',
  gradient: 'rounded-lg bg-gradient-to-br',
  textured: 'rounded-lg',
  animated: 'rounded-lg animate-pulse',
  premium_3d: 'rounded-xl shadow-2xl transform hover:scale-105 transition-transform',
  premium_crystal: 'rounded-xl shadow-2xl bg-gradient-to-br from-white/30 to-transparent backdrop-blur-sm',
  premium_metallic: 'rounded-xl shadow-2xl bg-gradient-to-br from-gray-100 to-gray-300',
};

export default function CustomTile({
  tile,
  colors,
  design,
  size = 'medium',
  onClick,
  selected = false,
}: CustomTileProps) {
  const sizeClasses = {
    small: 'w-10 h-14 text-xs',
    medium: 'w-12 h-16 text-sm',
    large: 'w-16 h-22 text-base',
  };

  const baseColor = colors[tile.color];
  const designClass = designClasses[design] || designClasses.standard;

  // Estilos según el diseño
  const getTileStyle = () => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: baseColor,
      borderColor: colors.border,
      color: colors.text,
    };

    if (design === 'neon_glow') {
      return {
        ...baseStyle,
        boxShadow: `0 0 10px ${baseColor}, 0 0 20px ${baseColor}, 0 0 30px ${baseColor}`,
      };
    }

    if (design === 'premium_3d') {
      return {
        ...baseStyle,
        boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.3)`,
      };
    }

    return baseStyle;
  };

  if (tile.isJoker) {
    return (
      <div
        className={`
          ${designClass}
          ${sizeClasses[size]}
          border-2 font-bold
          flex items-center justify-center
          cursor-pointer transition
          ${selected ? 'ring-4 ring-yellow-400 scale-110 z-50' : ''}
          ${onClick ? 'hover:scale-105' : ''}
        `}
        style={{
          ...getTileStyle(),
          backgroundColor: colors.joker,
        }}
        onClick={onClick}
      >
        <span className="text-2xl">★</span>
      </div>
    );
  }

  return (
    <div
      className={`
        ${designClass}
        ${sizeClasses[size]}
        border-2 font-bold
        flex flex-col items-center justify-center p-1
        cursor-pointer transition
        ${selected ? 'ring-4 ring-yellow-400 scale-110 z-50' : ''}
        ${onClick ? 'hover:scale-105' : ''}
      `}
      style={getTileStyle()}
      onClick={onClick}
    >
      <span className="font-black text-xl leading-none">{tile.value}</span>
      <div className="text-[8px] opacity-80 mt-0.5">
        {tile.color.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}
