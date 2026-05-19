'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormHeader } from '@/components/ui/form-header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2, Clock, CheckCircle2, XCircle, AlertCircle, AlertTriangle,
  ArrowRight, RefreshCw, Home, DollarSign, FileText, Camera, PenLine, X,
} from 'lucide-react';
import {
  getApplicationStatusAction,
  getApplicationDetailAction,
  getApplicationFullDetailAction,
  cancelApplicationAction,
  type ApplicationFullDetail,
} from '@/app/actions/application.actions';
import {
  listDocumentsAction,
  type DocumentListResult,
} from '@/app/actions/document.actions';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import { useSolicitudData } from './SolicitudContext';

// ── Config ────────────────────────────────────────────────────────────────────

/** Intervalo entre polls en ms */
const POLL_INTERVAL = 10_000;
/** Máximo de intentos antes de marcar como FAILED (10s × 30 = 5 min) */
const MAX_POLL_ATTEMPTS = 30;

// ── Props ─────────────────────────────────────────────────────────────────────

interface SolicitudViewProps {
  initialApplication: ApplicationRecord;
  initialFullDetail?: ApplicationFullDetail | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Componente principal ──────────────────────────────────────────────────────

export function SolicitudView({ initialApplication, initialFullDetail }: SolicitudViewProps) {
  const router = useRouter();
  const { setData } = useSolicitudData();
  const [application, setApplication] = useState(initialApplication);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [fullDetail, setFullDetail] = useState<ApplicationFullDetail | null>(initialFullDetail ?? null);
  const [showCelebration, setShowCelebration] = useState(false);

  // DEV: override status via query param ?status=PRE_APPROVED
  const [devStatus, setDevStatus] = useState<ApplicationStatus | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const params = new URLSearchParams(window.location.search);
    const override = params.get('status');
    if (override) setDevStatus(override as ApplicationStatus);
  }, []);

  const status = devStatus ?? application.status;
  const isPolling = status === 'SUBMITTED' || status === 'PROCESSING';
  const justApproved = showCelebration && (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS');

  // Publicar datos al contexto cuando ya están disponibles (para el sidebar)
  useEffect(() => {
    if (!isPolling && application) {
      setData(application, fullDetail);
    }
  }, [isPolling, application, fullDetail, setData]);

  // Cargar detalle completo si llegamos a la página con status terminal
  // y no tenemos el detalle (ej: navegación directa sin pasar por page.tsx)
  useEffect(() => {
    if (!isPolling && !fullDetail) {
      getApplicationFullDetailAction(application.id).then(setFullDetail);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef(0);

  // Timer visual (solo durante polling)
  useEffect(() => {
    if (!isPolling) return;
    timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPolling]);

  // Long polling
  useEffect(() => {
    if (!isPolling) return;

    const poll = async () => {
      attemptRef.current += 1;

      if (attemptRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setApplication(prev => ({ ...prev, status: 'FAILED' as ApplicationStatus, failureCode: 'EVALUATION_ERROR' }));
        return;
      }

      try {
        const newStatus = await getApplicationStatusAction(application.id);
        if (!newStatus) return;

        // Cualquier status que no sea SUBMITTED/PROCESSING es terminal para el polling
        if (newStatus !== 'SUBMITTED' && newStatus !== 'PROCESSING') {
          stopPolling();

          // Cargar datos completos ahora que hay resultado
          const [appData, detailData] = await Promise.all([
            getApplicationDetailAction(application.id),
            getApplicationFullDetailAction(application.id),
          ]);

          if (appData) {
            setApplication(appData);
          }
          setFullDetail(detailData);

          // Celebrar si es pre-aprobado
          if (newStatus === 'PRE_APPROVED' || newStatus === 'PENDING_DOCUMENTS') {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2500);
          }
        }
      } catch (e) {
        console.error('[POLLING] Error:', e);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, POLL_INTERVAL);
    return () => stopPolling();
  }, [isPolling, application.id]);

  function stopPolling() {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  // ── Render según status ───────────────────────────────────────────────────

  // Animación de celebración al aprobarse
  if (justApproved) {
    return <ApprovedCelebration />;
  }

  if (isPolling) {
    return <EvaluatingView timeElapsed={timeElapsed} />;
  }

  if (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS') {
    return <PreApprovedView application={application} fullDetail={fullDetail} />;
  }

  if (status === 'PENDING_SIGNATURE') {
    return <PreApprovedView application={application} fullDetail={fullDetail} />;
  }

  if (status === 'APPROVED') {
    return <ApprovedView application={application} fullDetail={fullDetail} />;
  }

  if (status === 'REJECTED') {
    return <RejectedView application={application} />;
  }

  if (status === 'REJECTED_BY_USER') {
    return <CancelledByUserView application={application} />;
  }

  if (status === 'EXPIRED') {
    return <ExpiredView application={application} />;
  }

  if (status === 'FAILED') {
    return <FailedView application={application} />;
  }

  // Fallback
  return <FailedView application={application} />;
}


// ── Vista: Evaluando (polling activo) ─────────────────────────────────────────

function EvaluatingView({ timeElapsed }: { timeElapsed: number }) {
  return (
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="flex flex-col items-center text-center space-y-8">
        {/* Loader con reloj */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Clock className="w-4 h-4 text-dark" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Estamos procesando tu solicitud
          </h1>
          <p className="text-muted-foreground max-w-md">
            Analizando tus datos para darte una respuesta. Esto puede tomar unos segundos.
          </p>
        </div>

        {/* Dots pulsantes */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '600ms' }} />
        </div>

        <p className="text-xs text-muted-foreground">
          No cierres esta ventana
        </p>
      </div>
    </Card>
  );
}

// ── Vista: Pre-aprobada ───────────────────────────────────────────────────────

function PreApprovedView({
  application,
  fullDetail,
}: {
  application: ApplicationRecord;
  fullDetail: ApplicationFullDetail | null;
}) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [docList, setDocList] = useState<DocumentListResult | null>(null);

  // Cargar documentos para saber qué pasos están completados
  useEffect(() => {
    listDocumentsAction(application.id).then(setDocList);
  }, [application.id]);

  const isDniUploaded = !!docList?.documents.find(
    (d) => d.type === 'DNI_FRONT' && d.status === 'UPLOADED'
  ) && !!docList?.documents.find(
    (d) => d.type === 'DNI_BACK' && d.status === 'UPLOADED'
  );
  const isSelfieUploaded = !!docList?.documents.find(
    (d) => d.type === 'SELFIE' && d.status === 'UPLOADED'
  );

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
      setCancelling(false);
    } catch {
      setCancelError('Error al cancelar la solicitud');
      setCancelling(false);
    }
  };
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

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

        {/* Resumen del préstamo */}
        {fullDetail && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Detalle de tu préstamo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Monto</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(fullDetail.principal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cuotas</p>
                  <p className="text-lg font-bold text-foreground">{fullDetail.installment_count}x</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pago mensual</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(fullDetail.monthly_payment)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total a pagar</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(fullDetail.total_to_pay)}</p>
                </div>
              </div>

              {fullDetail.schedule && fullDetail.schedule.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Cronograma de pagos</p>
                  <div className="space-y-1">
                    {fullDetail.schedule.map((inst) => (
                      <div key={inst.installment_no} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cuota {inst.installment_no} — {formatDate(inst.due_date)}</span>
                        <span className="font-medium text-foreground">{formatCurrency(inst.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Próximos pasos */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Próximos pasos para completar:</h3>

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
                  done: false,
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

        {/* Info importante */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Importante:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Completa estos pasos en los próximos 7 días</li>
                <li>• Ten a la mano tu DNI físico</li>
                <li>• Asegúrate de estar en un lugar bien iluminado</li>
                <li>• Una vez firmado, el dinero se desembolsará en 24-48 horas</li>
              </ul>
            </div>
          </div>
        </div>

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
            onClick={() => router.push(`/solicitudes/${application.id}/kyc-documentos`)}
            className="flex-1"
            size="lg"
          >
            Continuar con la verificación
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
      {application.canRetryAt && (
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
      )}

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

// ── Vista: Cancelada por el usuario ───────────────────────────────────────────

function CancelledByUserView({ application }: { application: ApplicationRecord }) {
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

// ── Animación de celebración (pre-aprobado) ────────────────────────────────────

function ApprovedCelebration() {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    requestAnimationFrame(() => {
      setPhase('show');
    });
    const timer = setTimeout(() => setPhase('exit'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center transition-all duration-700',
      phase === 'enter' ? 'bg-primary-900/0 backdrop-blur-0' : 'bg-primary-900/40 backdrop-blur-sm'
    )}>
      {/* Círculos decorativos de fondo */}
      <div className={cn(
        'absolute inset-0 overflow-hidden transition-opacity duration-1000',
        phase === 'enter' ? 'opacity-0' : 'opacity-100'
      )}>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }} />
      </div>

      <div className={cn(
        'flex flex-col items-center gap-8 transition-all duration-700 ease-out relative',
        phase === 'enter' ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
        phase === 'exit' ? 'scale-110 opacity-0' : ''
      )}>
        {/* Check animado con colores de marca */}
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {/* Anillo exterior */}
            <circle
              cx="70" cy="70" r="65"
              fill="none"
              stroke="var(--color-primary-200)"
              strokeWidth="3"
              className="transition-all duration-500 ease-out origin-center"
              style={{
                transform: phase === 'enter' ? 'scale(0)' : 'scale(1)',
                opacity: phase === 'show' ? 0.6 : 0,
              }}
            />
            {/* Círculo principal */}
            <circle
              cx="70" cy="70" r="55"
              fill="var(--color-primary-500)"
              className="transition-all duration-500 ease-out origin-center"
              style={{
                transform: phase === 'enter' ? 'scale(0)' : 'scale(1)',
              }}
            />
            {/* Check */}
            <path
              d="M42 70 L60 88 L98 50"
              fill="none"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="90"
              strokeDashoffset={phase === 'show' ? '0' : '90'}
              style={{ transition: 'stroke-dashoffset 0.6s ease-out 0.4s' }}
            />
          </svg>
          {/* Destellos */}
          <div className={cn(
            'absolute -top-3 -right-3 w-6 h-6 bg-accent-500 rounded-full transition-all duration-500',
            phase === 'show' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} style={{ transitionDelay: '600ms' }} />
          <div className={cn(
            'absolute -bottom-2 -left-4 w-4 h-4 bg-primary-300 rounded-full transition-all duration-500',
            phase === 'show' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} style={{ transitionDelay: '800ms' }} />
          <div className={cn(
            'absolute top-0 -left-6 w-3 h-3 bg-accent-400 rounded-full transition-all duration-500',
            phase === 'show' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} style={{ transitionDelay: '700ms' }} />
        </div>

        <div className={cn(
          'text-center space-y-3 transition-all duration-500',
          phase === 'enter' ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
        )} style={{ transitionDelay: '400ms' }}>
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">
            ¡Pre-aprobado!
          </h2>
          <p className="text-primary-100 text-lg">
            Tu solicitud ha sido aprobada
          </p>
        </div>
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


// ── Vista: Aprobada (contrato firmado) ────────────────────────────────────────

function ApprovedView({
  application,
  fullDetail,
}: {
  application: ApplicationRecord;
  fullDetail: ApplicationFullDetail | null;
}) {
  const router = useRouter();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

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

      {/* Resumen */}
      {fullDetail && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Resumen de tu préstamo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Monto</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(fullDetail.principal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total a pagar</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(fullDetail.total_to_pay)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuotas</p>
                <p className="text-lg font-bold text-foreground">{fullDetail.installment_count}x de {formatCurrency(fullDetail.monthly_payment)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Primera cuota</p>
                <p className="text-lg font-bold text-foreground">{formatDate(fullDetail.first_due_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notificación
      <div className="bg-success-50 border border-success-100 rounded-xl p-5">
        <div className="flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-success-700 shrink-0 mt-0.5" />
          <p className="text-sm text-success-700">
            Recibirás una notificación cuando el dinero esté disponible en tu cuenta.
          </p>
        </div>
      </div> */}

      <Button onClick={() => router.push('/dashboard')} size="lg" className="w-full">
        <Home className="w-4 h-4 mr-2" />
        Ir al dashboard
      </Button>
    </div>
  );
}

// ── Vista: Expirada ───────────────────────────────────────────────────────────

function ExpiredView({ application }: { application: ApplicationRecord }) {
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
