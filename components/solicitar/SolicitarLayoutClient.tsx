'use client';

import { usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { AppNavbar } from '@/components/ui/app-navbar';
import { FunnelProgressBar } from './SolicitarProgressBar';
import { FunnelLoanSummaryBanner } from './SolicitarLoanSummaryBanner';
import { FunnelSidebar } from './SolicitarSidebar';
import { SolicitarCalcProvider, useSolicitarCalc } from './SolicitarCalcContext';
import { SolicitarCalcPanel } from './SolicitarCalcPanel';
import { cn } from '@/lib/utils';

interface FunnelLayoutClientProps {
  user: User;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

/**
 * Layout del funnel de solicitud.
 *
 * Breakpoints:
 *   - Mobile (< md):   Panel overlay fullscreen con botón cerrar
 *   - Tablet (md-lg):  Panel inline al inicio (scrollea con el contenido)
 *   - Desktop (lg+):   Panel fixed al costado (siempre visible)
 */
function FunnelLayoutContent({ user, onSignOut, children }: FunnelLayoutClientProps) {
  const pathname = usePathname();
  const isOrchestrating = pathname === '/solicitar' || pathname === '/solicitar/start';
  const { isOpen, openCount } = useSolicitarCalc();

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

      {/* Desktop/Tablet: Sidebar (fixed left) */}
      <FunnelSidebar isLoading={isOrchestrating} />

      {/* ─── Desktop (lg+): Panel fixed al costado del sidebar ─── */}
      <div
        className={cn(
          'hidden lg:block fixed top-16 bottom-0 z-30 left-80 w-[440px] overflow-y-auto',
          !isOpen && 'invisible'
        )}
      >
        {isOpen && <SolicitarCalcPanel key={`panel-${openCount}`} />}
      </div>

      {/* ─── Mobile (< md): Panel overlay fullscreen ─── */}
      <div
        className={cn(
          'md:hidden fixed inset-0 top-16 z-40 bg-white overflow-y-auto',
          !isOpen && 'hidden'
        )}
      >
        {isOpen && <SolicitarCalcPanel key={`panel-m-${openCount}`} showClose />}
      </div>

      {/* ─── Main Content ─── */}
      <main
        className={cn(
          'flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 ease-in-out',
          'md:ml-72 lg:ml-80',
          isOpen && 'lg:ml-[calc(20rem+440px)]'
        )}
      >
        {/* Tablet (md-lg): Panel inline al inicio, antes del formulario */}
        {isOpen && (
          <div className="hidden md:block lg:hidden mb-6 -mx-6 -mt-6">
            <SolicitarCalcPanel key={`panel-t-${openCount}`} />
          </div>
        )}

        {children}
      </main>
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
