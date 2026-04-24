'use client';

import Link from 'next/link';
import { ArrowLeft, User, LogOut } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import type { User as UserType } from '@/lib/types';

interface FunnelNavbarProps {
  user: UserType;
  onSignOut: () => Promise<void>;
}

export function FunnelNavbar({ user, onSignOut }: FunnelNavbarProps) {
  const handleSignOut = async () => {
    await onSignOut();
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-fondea-text hover:text-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Volver al Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <Logo />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-dark">{user.name}</p>
              <p className="text-xs text-fondea-text">{user.email || user.phone}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 text-fondea-text hover:text-error transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
