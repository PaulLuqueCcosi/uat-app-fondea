'use client';

import { AppNavbar } from '@/components/ui/app-navbar';
import { SolicitudesSidebar } from './SolicitudesSidebar';
import { SolicitudesLoanSummaryBanner } from './SolicitudesLoanSummaryBanner';
import { SolicitudStoreInit } from './SolicitudContext';
import type { User } from '@/lib/types';

interface SolicitudesLayoutClientProps {
  user: User;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

export function SolicitudesLayoutClient({ user, onSignOut, children }: SolicitudesLayoutClientProps) {
  return (
    <>
      {/* Inicializa el store con el applicationId de la URL */}
      <SolicitudStoreInit />

      <AppNavbar
        user={user}
        onSignOut={onSignOut}
        backLink={{ href: '/dashboard', label: 'Volver al Dashboard' }}
      />

      <SolicitudesSidebar />

      <SolicitudesLoanSummaryBanner />

      <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-80">
        {children}
      </main>
    </>
  );
}
