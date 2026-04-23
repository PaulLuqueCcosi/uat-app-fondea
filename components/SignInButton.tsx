'use client';

import { Button } from '@/components/ui/button';

interface SignInButtonProps {
  onSignIn: () => Promise<void>;
  children: React.ReactNode;
  variant?: 'default' | 'ghost';
  size?: 'xs' | 'sm' | 'default' | 'lg';
  rightIcon?: React.ReactNode;
}

export function SignInButton({ onSignIn, children, variant = 'default', size = 'default', rightIcon }: SignInButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => onSignIn()}
    >
      {children}
      {rightIcon}
    </Button>
  );
}
