'use client';

import { usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { AppNavbar } from '@/components/ui/app-navbar';
import { FunnelProgressBar } from './SolicitarProgressBar';
import { FunnelLoanSummaryBanner } from './SolicitarLoanSummaryBanner';
import { FunnelSidebar } from './SolicitarSidebar';

interface FunnelLayoutClientProps {
  user: User;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

export function FunnelLayoutClient({ user, onSignOut, children }: FunnelLayoutClientProps) {
  const pathname = usePathname();
  const isOrchestrating = pathname === '/solicitar';

  return (
    <>
      <AppNavbar
        user={user}
        onSignOut={onSignOut}
        backLink={{ href: '/dashboard', label: 'Volver al Dashboard' }}
      />

      {/* Mobile: Pasos horizontales arriba, resumen abajo */}
      <div className="md:hidden">
        <FunnelProgressBar isLoading={isOrchestrating} />
        <FunnelLoanSummaryBanner />
      </div>

      {/* Desktop/Tablet: Sidebar */}
      <FunnelSidebar isLoading={isOrchestrating} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-80">
        {children}
      </main>
    </>
  );
}
