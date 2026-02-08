import React from 'react';

interface LogoProps {
  variant?: 'default' | 'horizontal' | 'icon' | 'dark' | 'monochrome';
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ 
  variant = 'default', 
  width, 
  height, 
  className = '' 
}: LogoProps) {
  const getLogoSrc = () => {
    switch (variant) {
      case 'horizontal':
        return '/logo-horizontal.svg';
      case 'icon':
        return '/logo-icon.svg';
      case 'dark':
        return '/logo-dark.svg';
      case 'monochrome':
        return '/logo-monochrome.svg';
      default:
        return '/logo.svg';
    }
  };

  const defaultDimensions = {
    default: { width: 400, height: 400 },
    horizontal: { width: 600, height: 200 },
    icon: { width: 200, height: 200 },
    dark: { width: 400, height: 400 },
    monochrome: { width: 400, height: 400 },
  };

  const dimensions = defaultDimensions[variant];
  const finalWidth = width || dimensions.width;
  const finalHeight = height || dimensions.height;

  return (
    <img
      src={getLogoSrc()}
      alt="Rummikub Pro Logo"
      width={finalWidth}
      height={finalHeight}
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
