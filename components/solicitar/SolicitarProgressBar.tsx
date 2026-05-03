'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  FUNNEL_STEPS,
  getCurrentStepIndex,
  getVisibleSteps
} from '@/lib/funnel-steps';

interface FunnelProgressBarProps {
  isLoading?: boolean;
}

export function FunnelProgressBar({ isLoading = false }: FunnelProgressBarProps) {
  const pathname = usePathname();
  const currentStepIndex = getCurrentStepIndex(pathname);
  const visibleSteps = getVisibleSteps(pathname);

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <Card className="rounded-none border-x-0 border-t-0">
      <CardContent className="py-1.5 overflow-x-auto scrollbar-hide">
        {isLoading ? (
          /* Skeleton horizontal para mobile */
          <div className="flex items-center gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                <div className="h-2.5 w-14 bg-muted animate-pulse rounded" />
                {i < 3 && <div className="w-6 h-px bg-muted animate-pulse ml-1" />}
              </div>
            ))}
          </div>
        ) : (
          /* Steps horizontal muy compactos */
          <div className="flex items-center gap-1.5">
            {visibleSteps.map((step, arrayIndex) => {
              const stepIndex = FUNNEL_STEPS.findIndex(s => s.id === step.id);
              const Icon = step.icon;
              const status = getStepStatus(stepIndex);
              const isActive = pathname === step.path;

              return (
                <div key={step.id} className="flex items-center shrink-0">
                  <Link
                    href={step.path}
                    className="flex items-center gap-1.5 transition-all group"
                  >
                    {/* Icon mini */}
                    <div className="relative">
                      {status === 'completed' ? (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      ) : status === 'current' ? (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-primary/30">
                          <Icon className="w-2.5 h-2.5 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                          <Circle className="w-2.5 h-2.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Label inline y mini */}
                    <p
                      className={cn(
                        'text-[10px] font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'text-primary'
                          : status === 'completed'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </p>
                  </Link>

                  {/* Connector line mini */}
                  {arrayIndex < visibleSteps.length - 1 && (
                    <div className="shrink-0 w-6 px-1.5">
                      <div
                        className={cn(
                          'h-px transition-colors',
                          status === 'completed' ? 'bg-primary' : 'bg-border'
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
