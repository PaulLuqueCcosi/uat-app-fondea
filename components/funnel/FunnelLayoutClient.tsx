'use client';

import { FunnelNavbar } from './FunnelNavbar';
import { FunnelProgressBar } from './FunnelProgressBar';
import { FunnelLoanSummaryBanner } from './FunnelLoanSummaryBanner';
import { FunnelSidebar } from './FunnelSidebar';
import type { User } from '@/lib/types';

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
