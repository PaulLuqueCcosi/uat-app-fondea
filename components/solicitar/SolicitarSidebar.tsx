'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  FUNNEL_STEPS,
  getCurrentStepIndex,
  getVisibleSteps
} from '@/lib/funnel-steps';
import { FunnelLoanSummaryCard } from '../solicitar/SolicitarLoanSummaryCard';

interface FunnelSidebarProps {
  isLoading?: boolean;
}

export function FunnelSidebar({ isLoading = false }: FunnelSidebarProps) {
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
        <FunnelLoanSummaryCard isOrchestrating={isLoading} />

        <div className="mb-2">
          <h2 className="text-lg font-bold text-dark">Proceso de Solicitud</h2>
        </div>

        {/* Skeleton mientras orquesta */}
        {isLoading ? (
          <div className="space-y-3 mt-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-2.5 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                  <div className="h-2.5 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vista del funnel */
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
                  <div className="relative z-10 shrink-0">
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
        )}
      </div>
    </aside>
  );
}
