'use client';

import { useRef, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Pencil, CheckCircle2, Circle, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { useSolicitarCalc } from './SolicitarCalcContext';
import { cn } from '@/lib/utils';
import {
  FUNNEL_STEPS,
  getCurrentStepIndex,
  getVisibleSteps
} from '@/lib/funnel-steps';

interface FunnelLoanSummaryBannerProps {
  isOrchestrating?: boolean;
}

export function FunnelLoanSummaryBanner({ isOrchestrating = false }: FunnelLoanSummaryBannerProps) {
  const config = useIntencionStore(s => s.intencion);
  const status = useIntencionStore(s => s.status);
  const fetchIntencion = useIntencionStore(s => s.fetch);
  const { isOpen, open, close } = useSolicitarCalc();
  const cardRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const currentStepIndex = getCurrentStepIndex(pathname);
  const visibleSteps = getVisibleSteps(pathname);

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  const loading = status === 'idle' || status === 'pending';
  const hasConfig = !loading && !!config;
  const noConfig = !loading && !config;

  useEffect(() => {
    if (!isOrchestrating) fetchIntencion();
  }, [isOrchestrating, fetchIntencion]);

  // Scroll horizontal al paso actual
  useEffect(() => {
    if (!stepsRef.current || !hasConfig) return;
    const timer = setTimeout(() => {
      const active = stepsRef.current!.querySelector('[data-current="true"]');
      if (active) {
        active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname, hasConfig, visibleSteps.length]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleEditClick = () => {
    if (isOpen) { close(); return; }
    if (!config) return;
    open({
      intencionId: config.intencionId,
      amount: config.amount,
      termDays: config.termDays,
      installmentCount: config.installmentCount,
    });
  };

  if (loading) {
    return (
      <div className="border-b border-border">
        <Card className="overflow-hidden border-0 shadow-none py-0 rounded-none gap-0">
          {/* Skeleton gradiente */}
          <div className="bg-linear-to-br from-primary-500 to-primary-700 px-4 py-2.5">
            <div className="animate-pulse space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-2 bg-white/20 rounded w-16" />
                <div className="h-7 bg-white/20 rounded w-14" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-7 bg-white/20 rounded w-24" />
                <div className="h-6 bg-white/15 rounded-lg w-28" />
                <div className="h-6 bg-white/15 rounded-lg w-24" />
              </div>
            </div>
          </div>
          {/* Skeleton steps */}
          <div className="px-4 py-2.5 animate-pulse">
            <div className="flex items-center gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 w-[76px]">
                  <div className="w-6 h-6 rounded-full bg-neutral-100" />
                  <div className="h-2.5 bg-neutral-100 rounded w-10" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div ref={cardRef} className="border-b border-border">
      {/* Estado: Sin intención */}
      {noConfig && (
        <Card className="overflow-hidden border-0 shadow-none py-0 rounded-none gap-0">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-warning-900">
                  Sin préstamo seleccionado
                </p>
                <p className="text-xs text-warning-700 leading-relaxed">
                  Debes elegir el monto y plazo antes de continuar.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs border-warning-400 text-warning-800 hover:bg-warning-100"
              onClick={handleEditClick}
            >
              Configurar préstamo
            </Button>
          </div>
        </Card>
      )}

      {/* Estado: Con intención activa */}
      {hasConfig && (
        <Card className="overflow-hidden border-0 shadow-none py-0 rounded-none gap-0">
          {/* Header gradiente */}
          <div className="bg-linear-to-br from-primary-500 to-primary-700 px-4 py-2.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium text-white/70 uppercase tracking-wider">
                  Tu Solicitud
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                  "h-7 text-xs text-white/90 hover:text-white hover:bg-white/15 border border-white/25 shrink-0 transition-all px-3",
                  isOpen && "bg-white/15"
                  )}
                  onClick={handleEditClick}
                >
                  <Pencil className="w-3 h-3 mr-1.5" />
                  <span>{isOpen ? 'Cerrar' : 'Editar'}</span>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(config!.amount)}
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 shadow-xs">
                  <div className="w-5 h-5 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-2.5 h-2.5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[9px] text-neutral-500 font-medium uppercase leading-tight">Cuotas</p>
                    <p className="text-xs font-semibold text-neutral-800 -mt-0.5">{config!.installmentCount} {config!.installmentCount === 1 ? 'cuota' : 'cuotas'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 shadow-xs">
                  <div className="w-5 h-5 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-2.5 h-2.5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[9px] text-neutral-500 font-medium uppercase leading-tight">Plazo</p>
                    <p className="text-xs font-semibold text-neutral-800 -mt-0.5">{config!.termDays} días</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Steps horizontales scrolleable — siempre visible */}
          <div ref={stepsRef} className="border-t border-neutral-100 px-4 py-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-stretch gap-0">
              {visibleSteps.map((step, arrayIndex) => {
                const stepIndex = FUNNEL_STEPS.findIndex(s => s.id === step.id);
                const Icon = step.icon;
                const s = getStepStatus(stepIndex);
                const isActive = pathname === step.path;

                return (
                  <div key={step.id} className="flex items-stretch shrink-0" data-current={isActive ? 'true' : undefined}>
                    <Link
                      href={step.path}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors w-[76px]',
                        isActive
                          ? 'bg-primary/10'
                          : 'hover:bg-background',
                        s === 'upcoming' && 'opacity-45'
                      )}
                    >
                      <div className="shrink-0">
                        {s === 'completed' ? (
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-dark" />
                          </div>
                        ) : s === 'current' ? (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-primary/30">
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <Circle className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className={cn(
                        'text-[10px] font-medium text-center leading-tight line-clamp-2',
                        isActive ? 'text-primary' : s === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {step.title}
                      </p>
                    </Link>
                    {arrayIndex < visibleSteps.length - 1 && (
                      <div className="flex items-center px-0.5">
                        <div className={cn('w-3 h-px', s === 'completed' ? 'bg-primary' : 'bg-border')} />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="shrink-0 w-4" />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
