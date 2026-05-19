'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, FileText, Camera, PenLine, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApplicationStatusAction, getApplicationFullDetailAction, type ApplicationFullDetail } from '@/app/actions/application.actions';
import { listDocumentsAction, type DocumentListResult } from '@/app/actions/document.actions';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CreditCard } from 'lucide-react';

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

export function SolicitudesSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const solicitudId = params.id as string | undefined;

  const [loanData, setLoanData] = useState<ApplicationFullDetail | null>(null);
  const [docList, setDocList] = useState<DocumentListResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar detalle y documentos
  const loadData = useCallback(async () => {
    if (!solicitudId) return;
    const [loan, docs] = await Promise.all([
      getApplicationFullDetailAction(solicitudId),
      listDocumentsAction(solicitudId),
    ]);
    if (loan) setLoanData(loan);
    if (docs) setDocList(docs);
    setLoading(false);
  }, [solicitudId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling de status para recargar detalle cuando la evaluación termine
  useEffect(() => {
    if (!solicitudId) return;

    let cancelled = false;
    const pollStatus = async () => {
      if (cancelled) return;
      const data = await getApplicationStatusAction(solicitudId);
      if (!data || cancelled) return;
      const s = data.status;
      // Si ya no está en evaluación, recargar detalle completo
      if (s !== 'SUBMITTED' && s !== 'PROCESSING') {
        const detail = await getApplicationFullDetailAction(solicitudId);
        if (detail && !cancelled) setLoanData(detail);
        return; // dejar de consultar
      }
      setTimeout(pollStatus, 3000);
    };
    pollStatus();
    return () => { cancelled = true; };
  }, [solicitudId]);

  // Determinar si cada paso está completado basado en documentos subidos
  const isDniUploaded = !!docList?.documents.find(
    (d) => d.type === 'DNI_FRONT' && d.status === 'UPLOADED'
  ) && !!docList?.documents.find(
    (d) => d.type === 'DNI_BACK' && d.status === 'UPLOADED'
  );
  const isSelfieUploaded = !!docList?.documents.find(
    (d) => d.type === 'SELFIE' && d.status === 'UPLOADED'
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

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
        {/* Card de resumen de solicitud - Bloqueado */}
        {loading ? (
          <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-pulse">
            <CardContent className="p-4">
              <div className="h-24"></div>
            </CardContent>
          </Card>
        ) : loanData ? (
          <Card className="mb-6 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-sm border-primary/20">
            <CardContent className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-medium text-primary/70 uppercase tracking-wide">
                    Tu Solicitud
                  </h3>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(loanData.principal)}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-3">
                {/* Cuotas */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Cuotas</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {loanData.installment_count}x de {formatCurrency(loanData.monthly_payment)}
                    </p>
                  </div>
                </div>

                {/* Primera cuota */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Primera cuota</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {formatDate(loanData.first_due_date)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="mb-2">
          <h2 className="text-lg font-bold text-dark">Proceso de Solicitud</h2>
        </div>

        <nav className="space-y-1">
          {/* Paso 1: Resumen de la solicitud */}
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
              <div className="relative z-10 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-dark" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-fondea-text">Paso 1</span>
                </div>
                <p className={cn(
                  'text-sm font-medium mt-0.5',
                  pathname === `/solicitudes/${solicitudId}` ? 'text-primary' : 'text-dark'
                )}>
                  Resumen
                </p>
                <p className="text-xs text-fondea-text mt-0.5">Revisa tu solicitud</p>
              </div>
            </Link>

            {/* Línea conectora */}
            <div className="absolute left-[26px] top-[44px] w-px h-[calc(100%-4px)] bg-secondary" />
          </div>

          {/* Pasos activos de solicitud */}
          {SOLICITUD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const stepPath = `/solicitudes/${solicitudId}/${step.path}`;
            const isActive = pathname === stepPath;

            // Determinar si el paso está completado basado en documentos
            let isCompleted = false;
            if (step.id === 'kyc-docs') isCompleted = isDniUploaded;
            if (step.id === 'kyc-selfie') isCompleted = isSelfieUploaded;

            const isCurrent = index === currentStepIndex;

            return (
              <Link
                key={step.id}
                href={stepPath}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors group relative',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : isCompleted
                    ? 'text-dark hover:bg-background'
                    : 'text-fondea-text hover:bg-background',
                  !isCompleted && !isCurrent && 'opacity-50'
                )}
              >
                {/* Line connector */}
                {index < SOLICITUD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[26px] top-[44px] w-px h-[calc(100%-4px)]',
                      isCompleted ? 'bg-secondary' : 'bg-border'
                    )}
                  />
                )}

                {/* Step icon */}
                <div className="relative z-10 flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-dark" />
                    </div>
                  ) : isCurrent ? (
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
                      Paso {index + 2}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] bg-success-100 text-success-700 px-1.5 py-0.5 rounded-full">
                        Completado
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-sm font-medium mt-0.5',
                      isActive ? 'text-primary' : isCompleted ? 'text-dark' : 'text-fondea-text'
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
    </aside>
  );
}
