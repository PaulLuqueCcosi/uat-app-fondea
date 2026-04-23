'use client';

import Link from 'next/link';
import { Bell, User, LogOut } from 'lucide-react';
import { Logo } from '@/app/components/ui/Logo';
import type { User as UserType } from '@/lib/types';

interface DashboardNavbarProps {
  user: UserType;
  onSignOut: () => Promise<void>;
}

export function DashboardNavbar({ user, onSignOut }: DashboardNavbarProps) {
  const handleSignOut = async () => {
    await onSignOut();
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo />
        </Link>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-fondea-text hover:text-dark transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
          </button>

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
