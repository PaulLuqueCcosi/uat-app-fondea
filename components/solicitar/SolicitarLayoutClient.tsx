'use client';

import type { User } from '@/lib/types';
import { FunnelNavbar } from './SolicitarNavbar';
import { FunnelProgressBar } from './SolicitarProgressBar';
import { FunnelLoanSummaryBanner } from './SolicitarLoanSummaryBanner';
import { FunnelSidebar } from './SolicitarSidebar';

interface FunnelLayoutClientProps {
  user: User;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

export function FunnelLayoutClient({ user, onSignOut, children }: FunnelLayoutClientProps) {
  return (
    <>
      <FunnelNavbar
        user={user}
        onSignOut={onSignOut}
      />

      {/* Mobile: Pasos horizontales arriba, resumen abajo */}
      <div className="md:hidden">
        <FunnelProgressBar />
        <FunnelLoanSummaryBanner />
      </div>

      {/* Desktop/Tablet: Sidebar */}
      <FunnelSidebar />

      {/* Main Content - con margen para el sidebar en desktop */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-80">
        {children}
      </main>
    </>
  );
}
