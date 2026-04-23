'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-white hover:bg-[#0090b8] active:bg-[#007fa3]',
  secondary: 'bg-secondary text-dark hover:bg-[#8fd42a] active:bg-[#7ec425]',
  ghost: 'bg-transparent text-primary border border-primary hover:bg-[#F0FAFE] active:bg-[#e0f5fc]',
  danger: 'bg-transparent text-error border border-error hover:bg-red-50',
};

const sizeClasses: Record<string, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  className,
  children,
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isDisabled
          ? 'bg-border text-[#94A3B8] cursor-not-allowed border-0'
          : variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
