import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accent?: 'primary' | 'secondary' | 'warning' | 'error';
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const accentClasses: Record<string, string> = {
  primary: 'border-l-4 border-l-primary',
  secondary: 'border-l-4 border-l-secondary',
  warning: 'border-l-4 border-l-warning',
  error: 'border-l-4 border-l-error',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  accent,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-card shadow-card',
        paddingClasses[padding],
        accent ? accentClasses[accent] : '',
        className
      )}
    >
      {children}
    </div>
  );
};
