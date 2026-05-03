'use client';

import { AppNavbar } from '@/components/ui/app-navbar';
import { SolicitudesSidebar } from './SolicitudesSidebar';
import type { User } from '@/lib/types';

interface SolicitudesLayoutClientProps {
  user: User;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

export function SolicitudesLayoutClient({ user, onSignOut, children }: SolicitudesLayoutClientProps) {
  return (
    <>
      <AppNavbar
        user={user}
        onSignOut={onSignOut}
        backLink={{ href: '/dashboard', label: 'Volver al Dashboard' }}
      />

      {/* Desktop/Tablet: Sidebar */}
      <SolicitudesSidebar />

      {/* Main Content - con margen para el sidebar en desktop */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-80">
        {children}
      </main>
    </>
  );
}
