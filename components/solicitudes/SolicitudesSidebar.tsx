'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, FileText, Camera, PenLine, Lock, Loader2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CreditCard } from 'lucide-react';

export function SolicitudesSidebar() {
  const pathname = usePathname();

  // Selectores granulares
  const applicationId = useSolicitudStore(s => s.applicationId);
  const application = useSolicitudStore(s => s.application);
  const fullDetail = useSolicitudStore(s => s.fullDetail);
  const documents = useSolicitudStore(s => s.documents);
  const documentsVerification = useSolicitudStore(s => s.documentsVerification);
  const contractInfo = useSolicitudStore(s => s.contractInfo);
  const isPolling = useSolicitudStore(s => s.isPolling);
  const applicationIntention = useSolicitudStore(s => s.applicationIntention);
  const fetchApplication = useSolicitudStore(s => s.fetchApplication);
  const fetchFullDetail = useSolicitudStore(s => s.fetchFullDetail);
  const fetchDocuments = useSolicitudStore(s => s.fetchDocuments);
  const fetchDocumentsVerification = useSolicitudStore(s => s.fetchDocumentsVerification);
  const fetchContract = useSolicitudStore(s => s.fetchContract);

  // Pedir datos al store
  useEffect(() => {
    if (!applicationId) return;
    fetchApplication();
    fetchFullDetail();
    fetchDocuments();
    fetchDocumentsVerification();
    fetchContract();
  }, [applicationId, fetchApplication, fetchFullDetail, fetchDocuments, fetchDocumentsVerification, fetchContract]);

  // ── ¿Mostrar pasos y card? Solo si el status lo permite ──
  const ACTIONABLE_STATUSES = ['PRE_APPROVED', 'PENDING_DOCUMENTS', 'PENDING_SIGNATURE', 'APPROVED'];
  const showSteps = application ? ACTIONABLE_STATUSES.includes(application.status) : false;

  // ── Pasos completados (basado en verificación, no solo upload) ──

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));

  return (
    <aside className="hidden md:flex flex-col w-80 bg-white border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto scrollbar-primary">
      <div className="p-6">

        {/* ── Card del préstamo — siempre visible ── */}
        {fullDetail ? (
          <Card className="mb-6 overflow-hidden border-0 shadow-lg py-0">
            <div className="bg-linear-to-br from-primary-500 to-primary-700 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-1">Tu Solicitud</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(fullDetail.principal)}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white/80" />
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100">
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">Cuotas</p>
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                      {fullDetail.installment_count}x de {formatCurrency(fullDetail.monthly_payment)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">Primera cuota</p>
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">{formatDate(fullDetail.first_due_date)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : applicationIntention ? (
          <Card className="mb-6 overflow-hidden border-0 shadow-lg py-0">
            <div className="bg-linear-to-br from-primary-500 to-primary-700 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-1">Tu Solicitud</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(applicationIntention.amount)}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white/80" />
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100">
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">Cuotas</p>
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                      {applicationIntention.installmentCount} {applicationIntention.installmentCount === 1 ? 'cuota' : 'cuotas'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">Plazo</p>
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">{applicationIntention.termDays} días</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <LoanCardSkeleton />
        )}

        {/* ── Pasos — solo si el status lo permite ── */}
        {showSteps && (!application ? <StepsSkeleton /> : isPolling ? (
          <div className="text-center py-6">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Analizando tu solicitud...</p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-neutral-800 uppercase tracking-wide">Pasos</h2>
            </div>
            <nav className="space-y-1">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const stepPath = step.path
                  ? `/solicitudes/${applicationId}/${step.path}`
                  : `/solicitudes/${applicationId}`;
                const isActive = pathname === stepPath;
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.id} className="relative">
                    {!isLast && (
                      <div className={cn(
                        'absolute left-[22px] top-[40px] w-px h-[calc(100%+4px)]',
                        step.completed ? 'bg-success-300' : 'bg-neutral-200'
                      )} />
                    )}
                    <Link
                      href={stepPath}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg transition-colors relative',
                        isActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-50'
                      )}
                    >
                      <div className="relative z-10 shrink-0">
                        <div className={cn(
                          'w-[36px] h-[36px] rounded-full flex items-center justify-center',
                          step.completed
                            ? 'bg-success-100'
                            : isActive
                              ? 'bg-primary-500'
                              : 'bg-neutral-100 border-2 border-neutral-200'
                        )}>
                          {step.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-success-600" />
                          ) : (
                            <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-neutral-500')} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium',
                          isActive ? 'text-primary-700' : step.completed ? 'text-neutral-800' : 'text-neutral-600'
                        )}>
                          {step.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
                      </div>
                      {step.completed && !isActive && (
                        <span className="text-[10px] font-medium text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
                          Listo
                        </span>
                      )}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </>
        ))}
      </div>
    </aside>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function LoanCardSkeleton() {
  return (
    <Card className="mb-6 overflow-hidden border-0 shadow-lg py-0">
      <div className="bg-linear-to-br from-primary-500 to-primary-700 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-white/20 rounded w-1/3" />
          <div className="h-8 bg-white/20 rounded w-2/3" />
        </div>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100">
          <div className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-neutral-100" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 bg-neutral-100 rounded w-1/3" />
              <div className="h-4 bg-neutral-100 rounded w-2/3" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-neutral-100" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 bg-neutral-100 rounded w-1/3" />
              <div className="h-4 bg-neutral-100 rounded w-2/3" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StepsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-neutral-100 rounded w-1/4 mb-4" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-[36px] h-[36px] rounded-full bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-100 rounded w-1/2" />
            <div className="h-3 bg-neutral-50 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
