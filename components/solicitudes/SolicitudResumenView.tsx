'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle2, XCircle, AlertCircle, AlertTriangle,
  ArrowRight, RefreshCw, Home, FileText, Camera, PenLine, X, Clock,
} from 'lucide-react';
import { cancelApplicationAction } from '@/app/actions/application.actions';
import type { ApplicationFullDetail } from '@/lib/stores/solicitud-store';
import type { DocumentListResult } from '@/lib/types/document';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import { LoanBreakdownCard } from './LoanBreakdownCard';

// ── Props ─────────────────────────────────────────────────────────────────────

import type { StoreStatus } from '@/lib/stores/credit-score-store';
import { Skeleton } from '@/components/ui/skeleton';

interface SolicitudResumenViewProps {
  application: ApplicationRecord;
  fullDetail: ApplicationFullDetail | null;
  documents: DocumentListResult | null;
  detailStatus: StoreStatus;
  documentsStatus: StoreStatus;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Componente principal ──────────────────────────────────────────────────────

export function SolicitudResumenView({ application, fullDetail, documents, detailStatus, documentsStatus }: SolicitudResumenViewProps) {
  const contractInfo = useSolicitudStore(s => s.contractInfo);

  // DEV: override status via query param ?status=PRE_APPROVED
  const [devStatus, setDevStatus] = useState<ApplicationStatus | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const params = new URLSearchParams(window.location.search);
    const override = params.get('status');
    if (override) setDevStatus(override as ApplicationStatus);
  }, []);

  const status = devStatus ?? application.status;

  if (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS' || status === 'PENDING_SIGNATURE') {
    return <PreApprovedView application={application} fullDetail={fullDetail} documents={documents} contractInfo={contractInfo} detailStatus={detailStatus} documentsStatus={documentsStatus} />;
  }

  if (status === 'APPROVED') {
    return <ApprovedView application={application} fullDetail={fullDetail} detailStatus={detailStatus} />;
  }

  if (status === 'REJECTED') {
    return <RejectedView application={application} />;
  }

  if (status === 'REJECTED_BY_USER') {
    return <CancelledByUserView />;
  }

  if (status === 'EXPIRED') {
    return <ExpiredView />;
  }

  if (status === 'FAILED') {
    return <FailedView application={application} />;
  }

  return <FailedView application={application} />;
}

// ── Vista: Pre-aprobada ───────────────────────────────────────────────────────

function PreApprovedView({
  application,
  fullDetail,
  documents,
  contractInfo,
  detailStatus,
  documentsStatus,
}: {
  application: ApplicationRecord;
  fullDetail: ApplicationFullDetail | null;
  documents: DocumentListResult | null;
  contractInfo: { status: string; contractId: string } | null;
  detailStatus: StoreStatus;
  documentsStatus: StoreStatus;
}) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isDniUploaded = !!documents?.documents.find(
    d => d.type === 'DNI_FRONT' && d.status === 'UPLOADED'
  ) && !!documents?.documents.find(
    d => d.type === 'DNI_BACK' && d.status === 'UPLOADED'
  );
  const isSelfieUploaded = !!documents?.documents.find(
    d => d.type === 'SELFIE' && d.status === 'UPLOADED'
  );
  const isContractSigned = contractInfo?.status === 'SIGNED';

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const result = await cancelApplicationAction('Usuario canceló la solicitud desde la web');
      if (result.success) {
        router.push('/dashboard');
        return;
      }
      setCancelError(result.error ?? 'No se pudo cancelar la solicitud');
    } catch {
      setCancelError('Error al cancelar la solicitud');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Hero — Pre-aprobado */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 p-8 md:p-10">
          {/* Decoración */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/3 rounded-full" />

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Icono check */}
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>

            <div className="text-center md:text-left flex-1">
              <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">
                ¡Felicidades!
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Tu solicitud está pre-aprobada
              </h1>
              <p className="text-white/80 text-base">
                Completa los siguientes pasos para recibir tu préstamo
              </p>
            </div>

            {/* Monto destacado */}
            {fullDetail && (
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-5 text-center shrink-0">
                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Monto aprobado</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(fullDetail.principal)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Detalle del préstamo con breakdown */}
        <LoanBreakdownCard fullDetail={fullDetail} detailStatus={detailStatus} />

        {/* Próximos pasos */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Próximos pasos:</h3>

            <div className="space-y-2">
              {[
                {
                  icon: FileText,
                  title: '1. Verificar tu identidad (DNI)',
                  desc: 'Sube fotos de tu DNI (adelante y atrás)',
                  done: isDniUploaded,
                  path: `/solicitudes/${application.id}/kyc-documentos`,
                },
                {
                  icon: Camera,
                  title: '2. Verificación biométrica',
                  desc: 'Toma una selfie para confirmar tu identidad',
                  done: isSelfieUploaded,
                  path: `/solicitudes/${application.id}/kyc-selfie`,
                },
                {
                  icon: PenLine,
                  title: '3. Firmar el contrato',
                  desc: 'Revisa y firma digitalmente tu contrato',
                  done: isContractSigned,
                  path: `/solicitudes/${application.id}/contrato`,
                },
              ].map((step, i) => (
                <button
                  key={i}
                  onClick={() => router.push(step.path)}
                  className="w-full flex items-center gap-3 p-4 border border-border rounded-lg bg-background hover:border-primary/50 transition-colors text-left"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    step.done ? 'bg-success-100' : 'bg-primary-50'
                  )}>
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-success-600" />
                    ) : (
                      <step.icon className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                  <Badge variant={step.done ? 'success' : 'warning'}>
                    {step.done ? 'Completado' : 'Pendiente'}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCancelModal(true)}
            className="flex-1"
            size="lg"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar solicitud
          </Button>
          <Button
            onClick={() => {
              if (!isDniUploaded) router.push(`/solicitudes/${application.id}/kyc-documentos`);
              else if (!isSelfieUploaded) router.push(`/solicitudes/${application.id}/kyc-selfie`);
              else router.push(`/solicitudes/${application.id}/contrato`);
            }}
            className="flex-1"
            size="lg"
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Modal cancelación */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar solicitud?</DialogTitle>
            <DialogDescription>
              Si cancelas esta solicitud, perderás la pre-aprobación y tendrás que volver a solicitar desde el inicio.
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
              {cancelError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={cancelling}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Vista: Aprobada ───────────────────────────────────────────────────────────

function ApprovedView({
  application,
  fullDetail,
  detailStatus,
}: {
  application: ApplicationRecord;
  fullDetail: ApplicationFullDetail | null;
  detailStatus: StoreStatus;
}) {
  const router = useRouter();

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Hero — Aprobada */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-success-500 to-success-700 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/3 rounded-full" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">
              ¡Felicidades!
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Solicitud aprobada
            </h1>
            <p className="text-white/80 text-base">
              Tu contrato fue firmado exitosamente. El desembolso se realizará en las próximas 24-48 horas.
            </p>
          </div>

          {fullDetail && (
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-5 text-center shrink-0">
              <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Monto aprobado</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(fullDetail.principal)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalle del préstamo con breakdown */}
      <LoanBreakdownCard fullDetail={fullDetail} detailStatus={detailStatus} />

      <Button onClick={() => router.push('/dashboard')} size="lg" className="w-full">
        <Home className="w-4 h-4 mr-2" />
        Ir al dashboard
      </Button>
    </div>
  );
}

// ── Vista: Rechazada ──────────────────────────────────────────────────────────

function RejectedView({ application }: { application: ApplicationRecord }) {
  const router = useRouter();
  const canRetry = application.canRetryAt ? new Date(application.canRetryAt) <= new Date() : false;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Hero — Rechazada */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-error-500 to-error-700 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">
              Resultado
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Solicitud no aprobada
            </h1>
            <p className="text-white/80 text-base">
              {application.rejectionReason ?? 'Lamentablemente tu solicitud no fue aprobada en esta ocasión'}
            </p>
          </div>
        </div>
      </div>

      {/* Fecha de reintento */}
      {/* {application.canRetryAt && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">¿Cuándo puedo volver a intentarlo?</p>
                <p className="text-muted-foreground">
                  Podrás presentar una nueva solicitud a partir del{' '}
                  <span className="font-semibold text-foreground">{formatDate(application.canRetryAt)}</span>.
                  {' '}Te recomendamos mejorar tu perfil crediticio durante este tiempo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Recomendaciones */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-2">¿Qué puedes hacer?</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Mejora tu score crediticio pagando tus deudas a tiempo</li>
              <li>• Reduce tus deudas actuales para mejorar tu capacidad de pago</li>
              <li>• Intenta con un monto menor o un plazo más largo</li>
              <li>• Solicita nuevamente cuando se cumpla el plazo de espera</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contacto */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            Si tienes dudas sobre esta decisión, contáctanos a{' '}
            <a href="mailto:soporte@fondea.pe" className="text-primary font-medium hover:underline">
              soporte@fondea.pe
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1" size="lg">
          <Home className="w-4 h-4 mr-2" />
          Volver al dashboard
        </Button>
        <Button
          onClick={() => router.push('/solicitar')}
          className="flex-1"
          size="lg"
          disabled={!canRetry}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {canRetry ? 'Nueva solicitud' : 'No disponible aún'}
        </Button>
      </div>
    </div>
  );
}

// ── Vista: Cancelada por usuario ──────────────────────────────────────────────

function CancelledByUserView() {
  const router = useRouter();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Hero — Cancelada */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-neutral-400 to-neutral-600 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <X className="w-10 h-10 text-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-sm font-medium text-white/60 uppercase tracking-wider mb-1">
              Cancelada
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Solicitud cancelada
            </h1>
            <p className="text-white/70 text-base">
              Cancelaste esta solicitud. Puedes iniciar una nueva cuando lo desees.
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Tus datos de perfil se mantienen guardados. Puedes solicitar un nuevo préstamo en cualquier momento.
          </p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1" size="lg">
          <Home className="w-4 h-4 mr-2" />
          Ir al dashboard
        </Button>
        <Button onClick={() => router.push('/solicitar')} className="flex-1" size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Nueva solicitud
        </Button>
      </div>
    </div>
  );
}

// ── Vista: Error técnico (FAILED) ─────────────────────────────────────────────

function FailedView({ application }: { application: ApplicationRecord }) {
  const router = useRouter();

  const failureMessages: Record<string, string> = {
    BUSINESS_VALIDATION_FAILED: 'Hubo un problema al validar tu información de negocio. Puedes intentarlo nuevamente.',
    SCORE_CALCULATION_FAILED: 'No pudimos calcular tu score crediticio. Inténtalo en unos minutos.',
    EVALUATION_ERROR: 'Ocurrió un error técnico durante la evaluación.',
  };

  const message = application.failureCode
    ? failureMessages[application.failureCode] ?? 'Ocurrió un error técnico.'
    : 'Ocurrió un error técnico durante la evaluación.';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Hero — Error */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-warning-500 to-warning-700 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">
              Error técnico
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Error en la evaluación
            </h1>
            <p className="text-white/80 text-base">{message}</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Este error no afecta tu perfil ni tu historial. Puedes reintentar el envío de la solicitud sin perder tus datos.
          </p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1" size="lg">
          <Home className="w-4 h-4 mr-2" />
          Ir al dashboard
        </Button>
        <Button onClick={() => router.push('/solicitar/summary')} className="flex-1" size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar solicitud
        </Button>
      </div>
    </div>
  );
}

// ── Vista: Expirada ───────────────────────────────────────────────────────────

function ExpiredView() {
  const router = useRouter();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Hero — Expirada */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-warning-400 to-warning-600 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-sm font-medium text-neutral-900/60 uppercase tracking-wider mb-1">
              Tiempo agotado
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
              Solicitud expirada
            </h1>
            <p className="text-neutral-800/80 text-base">
              Tu solicitud expiró porque no se completaron los pasos requeridos dentro del plazo de 7 días.
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            No te preocupes — puedes iniciar una nueva solicitud. Tus datos de perfil se mantienen guardados.
          </p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1" size="lg">
          <Home className="w-4 h-4 mr-2" />
          Ir al dashboard
        </Button>
        <Button onClick={() => router.push('/solicitar')} className="flex-1" size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Nueva solicitud
        </Button>
      </div>
    </div>
  );
}
