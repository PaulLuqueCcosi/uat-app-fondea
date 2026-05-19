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

/**
 * Layout del funnel de solicitud.
 *
 * Breakpoints:
 *   - Mobile (< md):   Panel como overlay fullscreen
 *   - Tablet (md-lg):  Panel arriba del main (apilado verticalmente)
 *   - Desktop (lg+):   Panel inline al costado izquierdo del main
 */
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

      {/* Área de contenido principal */}
      <div className="flex flex-col lg:flex-row flex-1 md:ml-72 lg:ml-80">

        {/* Tablet (md-lg): Panel arriba del main */}
        {isOpen && (
          <div className="hidden md:block lg:hidden border-b border-border">
            <SolicitarCalcPanel variant="horizontal" />
          </div>
        )}

        {/* Desktop (lg+): Panel inline al costado izquierdo */}
        <div
          className="hidden lg:block shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-border"
          style={{
            width: isOpen ? '440px' : '0px',
            opacity: isOpen ? 1 : 0,
          }}
        >
          {isOpen && <SolicitarCalcPanel variant="vertical" />}
        </div>

        {/* Main Content — formularios del paso actual */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile (< md): Panel como overlay fullscreen */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 flex flex-col bg-white">
          <SolicitarCalcPanel variant="vertical" />
        </div>
      )}
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
