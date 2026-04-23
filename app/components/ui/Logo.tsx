import React from 'react';

interface LogoProps {
  className?: string;
  height?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', height = 32 }) => (
  <img
    src="/logo.png"
    alt="Fondea"
    height={height}
    style={{ height: `${height}px`, width: 'auto' }}
    className={className}
  />
);
