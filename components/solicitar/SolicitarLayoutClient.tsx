'use client';

import { usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { AppNavbar } from '@/components/ui/app-navbar';
import { FunnelProgressBar } from './SolicitarProgressBar';
import { FunnelLoanSummaryBanner } from './SolicitarLoanSummaryBanner';
import { FunnelSidebar } from './SolicitarSidebar';
import { SolicitarCalcProvider, useSolicitarCalc } from './SolicitarCalcContext';
import { SolicitarCalcPanel } from './SolicitarCalcPanel';

interface FunnelLayoutClientProps {
  user: User;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

function FunnelLayoutContent({ user, onSignOut, children }: FunnelLayoutClientProps) {
  const pathname = usePathname();
  const isOrchestrating = pathname === '/solicitar' || pathname === '/solicitar/start';
  const { isOpen } = useSolicitarCalc();

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
        <FunnelLoanSummaryBanner isOrchestrating={isOrchestrating} />
      </div>

      {/* Desktop/Tablet: Sidebar */}
      <FunnelSidebar isLoading={isOrchestrating} />

      {/* Contenedor flex que se adapta cuando el panel se abre */}
      <div className="flex flex-1 md:ml-80">
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 ease-in-out overflow-y-auto">
          {children}
        </main>

        {/* Panel de calculadora que ocupa espacio */}
        <div
          className="hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
          style={{
            width: isOpen ? '500px' : '0px',
            opacity: isOpen ? 1 : 0,
          }}
        >
          <SolicitarCalcPanel />
        </div>
      </div>
    </>
  );
}

export function FunnelLayoutClient(props: FunnelLayoutClientProps) {
  return (
    <SolicitarCalcProvider>
      <FunnelLayoutContent {...props} />
    </SolicitarCalcProvider>
  );
}
