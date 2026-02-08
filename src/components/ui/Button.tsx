import React from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-amber-600 text-white hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-gray-600 text-white hover:bg-gray-500 active:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none border border-gray-500',
  ghost:
    'text-gray-300 hover:text-white hover:bg-gray-700/50 active:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none',
  danger:
    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 disabled:opacity-50 disabled:pointer-events-none',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base font-medium rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      className={clsx(
        'inline-flex items-center justify-center transition-colors duration-150',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
