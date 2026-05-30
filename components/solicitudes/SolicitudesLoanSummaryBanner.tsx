'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Circle, ClipboardList, FileText, Camera, PenLine,
  CreditCard, Calendar, Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import { cn } from '@/lib/utils';

const ACTIONABLE_STATUSES = ['PRE_APPROVED', 'PENDING_DOCUMENTS', 'PENDING_SIGNATURE', 'APPROVED'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));

export function SolicitudesLoanSummaryBanner() {
  const pathname = usePathname();
  const stepsRef = useRef<HTMLDivElement>(null);

  const applicationId = useSolicitudStore(s => s.applicationId);
  const application = useSolicitudStore(s => s.application);
  const fullDetail = useSolicitudStore(s => s.fullDetail);
  const documentsVerification = useSolicitudStore(s => s.documentsVerification);
  const contractInfo = useSolicitudStore(s => s.contractInfo);
  const applicationIntention = useSolicitudStore(s => s.applicationIntention);
  const isPolling = useSolicitudStore(s => s.isPolling);

  const hasData = !!fullDetail || !!applicationIntention;
  const showSteps = application && ACTIONABLE_STATUSES.includes(application.status);

  const isDniCompleted =
    documentsVerification?.dniFront.status === 'VERIFIED' &&
    documentsVerification?.dniBack.status === 'VERIFIED';
  const isSelfieCompleted = documentsVerification?.selfie.status === 'VERIFIED';
  const isContractCompleted = contractInfo?.status === 'SIGNED';

  const steps = [
    { id: 'resumen', title: 'Resumen', description: 'Revisa tu solicitud', icon: ClipboardList, path: '', completed: true },
    { id: 'kyc-docs', title: 'Documentos DNI', description: 'Verificación de identidad', icon: FileText, path: 'kyc-documentos', completed: isDniCompleted },
    { id: 'kyc-selfie', title: 'Selfie', description: 'Verificación biométrica', icon: Camera, path: 'kyc-selfie', completed: isSelfieCompleted },
    { id: 'contrato', title: 'Contrato', description: 'Firmar contrato', icon: PenLine, path: 'contrato', completed: isContractCompleted },
  ];

  useEffect(() => {
    if (!stepsRef.current || !showSteps) return;
    const timer = setTimeout(() => {
      const active = stepsRef.current!.querySelector('[data-current="true"]');
      if (active) {
        active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname, showSteps]);

  if (!applicationId) return null;

  return (
    <div className="border-b border-border md:hidden">
      <Card className="overflow-hidden border-0 shadow-none py-0 rounded-none gap-0">
        {/* Loading: Skeleton */}
        {!hasData && !isPolling && (
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
        )}

        {/* Loan card */}
        {hasData && (
          <div className="bg-linear-to-br from-primary-500 to-primary-700 px-4 py-2.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Tu Solicitud</p>
                {isPolling && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/70" />}
              </div>
              {fullDetail ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(fullDetail.principal)}</p>
                  <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 shadow-xs">
                    <div className="w-5 h-5 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                      <CreditCard className="w-2.5 h-2.5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 font-medium uppercase leading-tight">Cuotas</p>
                      <p className="text-xs font-semibold text-neutral-800 -mt-0.5">{fullDetail.installment_count}x {formatCurrency(fullDetail.monthly_payment)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 shadow-xs">
                    <div className="w-5 h-5 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                      <Calendar className="w-2.5 h-2.5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 font-medium uppercase leading-tight">Primera cuota</p>
                      <p className="text-xs font-semibold text-neutral-800 -mt-0.5">{formatDate(fullDetail.first_due_date)}</p>
                    </div>
                  </div>
                </div>
              ) : applicationIntention ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(applicationIntention.amount)}</p>
                  <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 shadow-xs">
                    <div className="w-5 h-5 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                      <CreditCard className="w-2.5 h-2.5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 font-medium uppercase leading-tight">Cuotas</p>
                      <p className="text-xs font-semibold text-neutral-800 -mt-0.5">{applicationIntention.installmentCount} {applicationIntention.installmentCount === 1 ? 'cuota' : 'cuotas'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 shadow-xs">
                    <div className="w-5 h-5 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                      <Calendar className="w-2.5 h-2.5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 font-medium uppercase leading-tight">Plazo</p>
                      <p className="text-xs font-semibold text-neutral-800 -mt-0.5">{applicationIntention.termDays} días</p>
                    </div>
                  </div>
                </div>
              ) : isPolling && (
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                  <p className="text-xs text-white/70">Analizando tu solicitud...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No data (shouldn't happen since layout loads on mount, but safe guard) */}
        {!hasData && isPolling && (
          <div className="bg-linear-to-br from-primary-500 to-primary-700 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
              <p className="text-xs text-white/70">Analizando tu solicitud...</p>
            </div>
          </div>
        )}

        {/* Steps — solo si hay datos y status es actionable */}
        {hasData && showSteps && (
          <div ref={stepsRef} className="border-t border-neutral-100 px-4 py-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-stretch gap-0">
              {steps.map((step, arrayIndex) => {
                const stepPath = step.path
                  ? `/solicitudes/${applicationId}/${step.path}`
                  : `/solicitudes/${applicationId}`;
                const isActive = pathname === stepPath;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex items-stretch shrink-0" data-current={isActive ? 'true' : undefined}>
                    <Link
                      href={stepPath}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors w-[76px]',
                        isActive ? 'bg-primary/10' : 'hover:bg-background',
                        step.completed && !isActive && 'opacity-100',
                        !step.completed && !isActive && 'opacity-45'
                      )}
                    >
                      <div className="shrink-0">
                        {step.completed ? (
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-dark" />
                          </div>
                        ) : isActive ? (
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
                        isActive ? 'text-primary' : step.completed ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {step.title}
                      </p>
                    </Link>
                    {arrayIndex < steps.length - 1 && (
                      <div className="flex items-center px-0.5">
                        <div className={cn('w-3 h-px', step.completed ? 'bg-primary' : 'bg-border')} />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="shrink-0 w-4" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
