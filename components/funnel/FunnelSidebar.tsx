'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FUNNEL_STEPS,
  getCurrentStepIndex,
  getVisibleSteps
} from '@/lib/funnel-steps';
import { FunnelLoanSummaryCard } from './FunnelLoanSummaryCard';

export function FunnelSidebar() {
  const pathname = usePathname();
  const currentStepIndex = getCurrentStepIndex(pathname);
  const visibleSteps = getVisibleSteps(pathname);

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <aside className="hidden md:flex flex-col w-80 bg-white border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto">
      <div className="p-6">
        {/* Card de resumen de solicitud */}
        <FunnelLoanSummaryCard />

        <div className="mb-2">
          <h2 className="text-lg font-bold text-dark">Proceso de Solicitud</h2>
        </div>

        <nav className="space-y-1">
          {visibleSteps.map((step, arrayIndex) => {
            const stepIndex = FUNNEL_STEPS.findIndex(s => s.id === step.id);
            const Icon = step.icon;
            const status = getStepStatus(stepIndex);
            const isActive = pathname === step.path;

            return (
              <Link
                key={step.id}
                href={step.path}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors group relative',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : status === 'completed'
                    ? 'text-dark hover:bg-background'
                    : 'text-fondea-text hover:bg-background',
                  status === 'upcoming' && 'opacity-50'
                )}
              >
                {/* Line connector */}
                {arrayIndex < visibleSteps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[26px] top-[44px] w-px h-[calc(100%-4px)]',
                      status === 'completed' ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}

                {/* Step icon/number */}
                <div className="relative z-10 flex-shrink-0">
                  {status === 'completed' ? (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-dark" />
                    </div>
                  ) : status === 'current' ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                      <Icon className="w-4 h-4 text-fondea-text" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-fondea-text">
                      Paso {step.id}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm font-medium mt-0.5',
                      isActive ? 'text-primary' : status === 'completed' ? 'text-dark' : 'text-fondea-text'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-fondea-text mt-0.5">
                    {step.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Estados alternativos */}
      {(pathname === '/funnel/approved' ||
        pathname === '/funnel/rejected' ||
        pathname === '/funnel/more-info' ||
        pathname === '/funnel/contract-signed') && (
        <div className="p-6 border-t border-border bg-background/50">
          <div className="text-center">
            {pathname === '/funnel/approved' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-dark">¡Aprobado!</p>
                <p className="text-xs text-fondea-text mt-1">
                  Continúa con los siguientes pasos
                </p>
              </>
            )}
            {pathname === '/funnel/rejected' && (
              <>
                <Circle className="w-12 h-12 text-error mx-auto mb-2" />
                <p className="text-sm font-semibold text-dark">Solicitud Rechazada</p>
                <p className="text-xs text-fondea-text mt-1">
                  Revisa las razones
                </p>
              </>
            )}
            {pathname === '/funnel/more-info' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-warning mx-auto mb-2" />
                <p className="text-sm font-semibold text-dark">Más Información</p>
                <p className="text-xs text-fondea-text mt-1">
                  Completa los datos faltantes
                </p>
              </>
            )}
            {pathname === '/funnel/contract-signed' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-dark">¡Proceso Completo!</p>
                <p className="text-xs text-fondea-text mt-1">
                  Tu solicitud está lista
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
