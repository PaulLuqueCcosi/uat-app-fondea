'use client';

import { useEffect, useState } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, FileText, Camera, PenLine, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSolicitudData } from './SolicitudContext';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CreditCard } from 'lucide-react';
import {
  getApplicationStatusAction,
  getApplicationDetailAction,
  getApplicationFullDetailAction,
} from '@/app/actions/application.actions';
import type { ApplicationStatus } from '@/lib/types';

const SOLICITUD_STEPS = [
  {
    id: 'kyc-docs',
    title: 'Documentos DNI',
    description: 'Verificación de identidad',
    icon: FileText,
    path: 'kyc-documentos'
  },
  {
    id: 'kyc-selfie',
    title: 'Selfie',
    description: 'Verificación biométrica',
    icon: Camera,
    path: 'kyc-selfie'
  },
  {
    id: 'contrato',
    title: 'Contrato',
    description: 'Firmar contrato',
    icon: PenLine,
    path: 'contrato'
  }
];

/** Estados que permiten ver el resumen y navegar subpáginas */
const DETAIL_STATUSES: ApplicationStatus[] = [
  'PRE_APPROVED',
  'PENDING_DOCUMENTS',
  'PENDING_SIGNATURE',
  'APPROVED',
];

/**
 * Sidebar de solicitudes.
 * Consume datos del SolicitudContext (publicados por SolicitudView).
 * Si el contexto está vacío (entrada directa a subpágina), carga los datos.
 */
export function SolicitudesSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const solicitudId = params.id as string | undefined;
  const { fullDetail, isReady, setData } = useSolicitudData();
  const [loadingSidebar, setLoadingSidebar] = useState(false);

  // Auto-cargar datos si el contexto está vacío y estamos en una subpágina
  // En la página principal (/solicitudes/{id}), SolicitudView se encarga de publicar los datos
  const isSubpage = solicitudId ? pathname !== `/solicitudes/${solicitudId}` : false;

  useEffect(() => {
    if (isReady || !solicitudId || !isSubpage) return;

    let cancelled = false;
    setLoadingSidebar(true);

    async function loadData() {
      try {
        const status = await getApplicationStatusAction(solicitudId!);
        if (cancelled || !status) return;

        // Solo cargar detalle si el status lo permite
        if (!DETAIL_STATUSES.includes(status)) return;

        const [appData, detailData] = await Promise.all([
          getApplicationDetailAction(solicitudId!),
          getApplicationFullDetailAction(solicitudId!),
        ]);

        if (cancelled) return;
        if (appData) {
          setData(appData, detailData);
        }
      } catch (err) {
        console.error('[Sidebar] Error cargando datos:', err);
      } finally {
        if (!cancelled) setLoadingSidebar(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [isReady, solicitudId, isSubpage, setData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));

  const getCurrentStepIndex = () => {
    if (pathname.includes('kyc-documentos')) return 0;
    if (pathname.includes('kyc-selfie')) return 1;
    if (pathname.includes('contrato')) return 2;
    return -1;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <aside className="hidden md:flex flex-col w-80 bg-white border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto scrollbar-primary">
      <div className="p-6">
        {/* Card de resumen — solo se muestra cuando hay datos */}
        {loadingSidebar && isSubpage && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
        {isReady && fullDetail && (
          <Card className="mb-6 overflow-hidden border-0 shadow-lg py-0">
            <div className="bg-linear-to-br from-primary-500 to-primary-700 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-1">
                    Tu Solicitud
                  </p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(fullDetail.principal)}
                  </p>
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
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                      {formatDate(fullDetail.first_due_date)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-2">
          <h2 className="text-lg font-bold text-dark">Proceso de Solicitud</h2>
        </div>

        <nav className="space-y-1">
          {/* Paso 1: Resumen */}
          <div className="relative">
            <Link
              href={`/solicitudes/${solicitudId}`}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors group relative',
                pathname === `/solicitudes/${solicitudId}`
                  ? 'bg-primary/10 text-primary'
                  : 'text-dark hover:bg-background'
              )}
            >
              <div className="relative z-10 shrink-0">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-dark" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-fondea-text">Paso 1</span>
                <p className={cn(
                  'text-sm font-medium mt-0.5',
                  pathname === `/solicitudes/${solicitudId}` ? 'text-primary' : 'text-dark'
                )}>
                  Resumen
                </p>
                <p className="text-xs text-fondea-text mt-0.5">Revisa tu solicitud</p>
              </div>
            </Link>
            <div className="absolute left-[26px] top-[44px] w-px h-[calc(100%-4px)] bg-secondary" />
          </div>

          {/* Pasos de verificación */}
          {SOLICITUD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const stepPath = `/solicitudes/${solicitudId}/${step.path}`;
            const isActive = pathname === stepPath;
            const isCurrent = index === currentStepIndex;

            return (
              <Link
                key={step.id}
                href={stepPath}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors group relative',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-fondea-text hover:bg-background',
                  !isCurrent && 'opacity-50'
                )}
              >
                {index < SOLICITUD_STEPS.length - 1 && (
                  <div className="absolute left-[26px] top-[44px] w-px h-[calc(100%-4px)] bg-border" />
                )}

                <div className="relative z-10 shrink-0">
                  {isCurrent ? (
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
                  <span className="text-xs font-medium text-fondea-text">Paso {index + 2}</span>
                  <p className={cn(
                    'text-sm font-medium mt-0.5',
                    isActive ? 'text-primary' : 'text-fondea-text'
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-fondea-text mt-0.5">{step.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
