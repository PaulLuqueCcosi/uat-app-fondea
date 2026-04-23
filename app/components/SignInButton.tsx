'use client';

import { Button } from './ui/Button';

interface SignInButtonProps {
  onSignIn: () => Promise<void>;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  rightIcon?: React.ReactNode;
}

export function SignInButton({ onSignIn, children, variant = 'ghost', size = 'md', rightIcon }: SignInButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      rightIcon={rightIcon}
      onClick={() => onSignIn()}
    >
      {children}
    </Button>
  );
}
