'use client';

import { FunnelNavbar } from '../funnel/FunnelNavbar';
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
      <FunnelNavbar
        user={user}
        onSignOut={onSignOut}
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
