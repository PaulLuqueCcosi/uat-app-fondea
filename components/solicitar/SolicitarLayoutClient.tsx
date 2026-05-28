'use client';

import { usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { AppNavbar } from '@/components/ui/app-navbar';
import { FunnelProgressBar } from './SolicitarProgressBar';
import { FunnelLoanSummaryBanner } from './SolicitarLoanSummaryBanner';
import { FunnelSidebar } from './SolicitarSidebar';
import { SolicitarCalcProvider, useSolicitarCalc } from './SolicitarCalcContext';
import { SolicitarCalcPanel } from './SolicitarCalcPanel';
import { DOMErrorLogger } from '@/components/debug/DOMErrorLogger';
import { cn } from '@/lib/utils';

interface FunnelLayoutClientProps {
  user: User;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

// ── Panel de calculadora (se re-renderiza con isOpen) ─────────────────────────

function CalcPanels() {
  const { isOpen, openCount } = useSolicitarCalc();

  return (
    <div className="contents">
      {/* ─── Desktop (lg+): Panel fixed al costado del sidebar ─── */}
      <div
        data-calc-panel="desktop"
        className={cn(
          'hidden lg:block fixed top-16 bottom-0 z-30 left-80 w-[440px] overflow-y-auto transition-opacity duration-200',
          !isOpen && 'pointer-events-none opacity-0'
        )}
        aria-hidden={!isOpen}
      >
        {isOpen && <SolicitarCalcPanel key={`panel-${openCount}`} />}
      </div>

      {/* ─── Mobile (< md): Panel overlay fullscreen ─── */}
      <div
        data-calc-panel="mobile"
        className={cn(
          'md:hidden fixed inset-0 top-16 z-40 bg-white overflow-y-auto transition-opacity duration-200',
          !isOpen && 'pointer-events-none opacity-0'
        )}
        aria-hidden={!isOpen}
      >
        {isOpen && <SolicitarCalcPanel key={`panel-m-${openCount}`} showClose />}
      </div>
    </div>
  );
}

// ── Main content wrapper (se re-renderiza con isOpen para el margin) ──────────

function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen, openCount } = useSolicitarCalc();

  return (
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
  );
}

// ── Contenido estático del layout (navbar + sidebar) ──────────────────────────

function StaticLayoutContent({
  user,
  onSignOut,
  isOrchestrating,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  isOrchestrating: boolean;
}) {
  return (
    <div className="contents">
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
    </div>
  );
}

// ── Layout principal ──────────────────────────────────────────────────────────

/**
 * Layout del funnel de solicitud.
 *
 * Arquitectura para evitar "insertBefore" errors:
 * - StaticLayoutContent: navbar + sidebar (memoizado, no se re-renderiza con isOpen)
 * - CalcPanels: paneles de calculadora (se re-renderiza con isOpen, aislado)
 * - MainContent: contenido principal + children (solo cambia el margin con isOpen)
 *
 * El div root con className="contents" actúa como contenedor DOM estable.
 * Los children (que vienen del Next.js layout router) están aislados dentro
 * de MainContent y no se ven afectados por cambios en el panel de calculadora.
 */
function FunnelLayoutContent({ user, onSignOut, children }: FunnelLayoutClientProps) {
  const pathname = usePathname();
  const isOrchestrating = pathname === '/solicitar' || pathname === '/solicitar/start';

  return (
    <div className="contents">
      <StaticLayoutContent
        user={user}
        onSignOut={onSignOut}
        isOrchestrating={isOrchestrating}
      />

      <CalcPanels />

      <MainContent>
        {children}
      </MainContent>
    </div>
  );
}

export function FunnelLayoutClient(props: FunnelLayoutClientProps) {
  return (
    <SolicitarCalcProvider>
      <DOMErrorLogger />
      <FunnelLayoutContent {...props} />
    </SolicitarCalcProvider>
  );
}
