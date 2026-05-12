'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormHeader } from '@/components/ui/form-header';
import {
  Loader2, Clock, CheckCircle2, XCircle, AlertCircle, AlertTriangle,
  ArrowRight, RefreshCw, Home, DollarSign, FileText, Camera, PenLine, X,
} from 'lucide-react';
import { getApplicationStatusAction } from '@/app/actions/application.actions';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';

// ── Config ────────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 60;

// ── Props ─────────────────────────────────────────────────────────────────────

interface SolicitudViewProps {
  initialApplication: ApplicationRecord;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Componente principal ──────────────────────────────────────────────────────

export function SolicitudView({ initialApplication }: SolicitudViewProps) {
  const router = useRouter();
  const [application, setApplication] = useState(initialApplication);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const status = application.status;
  const isPolling = status === 'SUBMITTED' || status === 'PROCESSING';

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
        const data = await getApplicationStatusAction(application.id);
        if (!data) return;

        const newStatus = data.status;

        // Cualquier status que no sea SUBMITTED/PROCESSING es terminal para el polling
        if (newStatus !== 'SUBMITTED' && newStatus !== 'PROCESSING') {
          stopPolling();
          setApplication(prev => ({
            ...prev,
            status: newStatus,
            creditScore: data.creditScore,
            rejectionReason: data.rejectionReason,
            canRetryAt: data.canRetryAt,
            failureCode: data.failureCode as any,
          }));
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

  if (isPolling) {
    return <EvaluatingView timeElapsed={timeElapsed} />;
  }

  if (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS') {
    return <PreApprovedView application={application} />;
  }

  if (status === 'PENDING_SIGNATURE') {
    return <PreApprovedView application={application} />;
  }

  if (status === 'APPROVED') {
    return <ApprovedView application={application} />;
  }

  if (status === 'REJECTED' || status === 'REJECTED_BY_USER') {
    return <RejectedView application={application} />;
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
  const progress = Math.min(95, 30 + (timeElapsed / 10) * 65);

  const steps = [
    { label: 'Verificando datos del perfil', done: timeElapsed >= 2 },
    { label: 'Validación de reglas de negocio', done: timeElapsed >= 5, active: timeElapsed >= 2 && timeElapsed < 5 },
    { label: 'Cálculo de score crediticio', done: timeElapsed >= 8, active: timeElapsed >= 5 && timeElapsed < 8 },
    { label: 'Generando resultado', done: false, active: timeElapsed >= 8 },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="flex flex-col items-center text-center space-y-6">
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
            Evaluando tu solicitud…
          </h1>
          <p className="text-muted-foreground">
            Estamos analizando tu información. Solo tomará unos segundos.
          </p>
        </div>

        <div className="w-full space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">Analizando…</p>
        </div>

        <div className="w-full space-y-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                step.active ? 'bg-primary/5 border border-primary/20' :
                step.done   ? 'bg-muted/50' : 'bg-muted/30 opacity-50'
              }`}
            >
              {step.done
                ? <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />
                : step.active
                  ? <Loader2 className="w-5 h-5 text-primary shrink-0 animate-spin" />
                  : <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
              }
              <span className={`text-sm ${step.active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 w-full text-left">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              No cierres esta ventana. Recibirás el resultado en breve.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Vista: Pre-aprobada ───────────────────────────────────────────────────────

function PreApprovedView({ application }: { application: ApplicationRecord }) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      // TODO: Llamar API para cancelar solicitud cuando exista
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/dashboard');
    } catch {
      setCancelling(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <FormHeader
            icon={CheckCircle2}
            title="¡Tu solicitud está pre-aprobada!"
            description="Completa los siguientes pasos para recibir tu préstamo"
          />
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Score crediticio si está disponible */}
          {application.creditScore && (
            <Card className="border-2 border-success-100 bg-success-50">
              <div className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success-700" />
                </div>
                <div>
                  <p className="text-sm text-success-700 font-medium">Score crediticio</p>
                  <p className="text-2xl font-bold text-success-900">{application.creditScore} pts</p>
                </div>
              </div>
            </Card>
          )}

          {/* Próximos pasos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Próximos pasos para completar:</h3>

            <div className="space-y-2">
              {[
                { icon: FileText, title: '1. Verificar tu identidad (DNI)', desc: 'Sube fotos de tu DNI (adelante y atrás)' },
                { icon: Camera, title: '2. Verificación biométrica', desc: 'Toma una selfie para confirmar tu identidad' },
                { icon: PenLine, title: '3. Firmar el contrato', desc: 'Revisa y firma digitalmente tu contrato' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-4 border border-border rounded-lg bg-background">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                  <Badge variant="pending">Pendiente</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Info importante */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
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
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
        </CardContent>
      </Card>

      {/* Modal cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-error-50 flex items-center justify-center">
                  <X className="w-5 h-5 text-error-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">¿Cancelar solicitud?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Si cancelas esta solicitud, perderás la pre-aprobación y tendrás que volver a solicitar desde el inicio.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={cancelling} className="flex-1">
                  Volver
                </Button>
                <Button variant="destructive" onClick={handleCancel} disabled={cancelling} className="flex-1">
                  {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// ── Vista: Rechazada ──────────────────────────────────────────────────────────

function RejectedView({ application }: { application: ApplicationRecord }) {
  const router = useRouter();
  const canRetry = application.canRetryAt ? new Date(application.canRetryAt) <= new Date() : false;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={XCircle}
          title="Solicitud no aprobada"
          description={application.rejectionReason ?? 'Lamentablemente tu solicitud no fue aprobada en esta ocasión'}
        />
      </CardHeader>

      <CardContent className="pt-0 space-y-6">
        {/* Fecha de reintento */}
        {application.canRetryAt && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
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
          </div>
        )}

        {/* Recomendaciones */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
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
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Si tienes dudas sobre esta decisión, contáctanos a{' '}
            <a href="mailto:soporte@fondea.pe" className="text-primary font-medium hover:underline">
              soporte@fondea.pe
            </a>
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
      </CardContent>
    </Card>
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
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-warning-50 flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-warning-700" />
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Error en la evaluación
          </h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 w-full text-left">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Este error no afecta tu perfil ni tu historial. Puedes reintentar el envío de la solicitud sin perder tus datos.
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3">
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
    </Card>
  );
}


// ── Vista: Aprobada (contrato firmado) ────────────────────────────────────────

function ApprovedView({ application }: { application: ApplicationRecord }) {
  const router = useRouter();

  return (
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-success-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-success-500" />
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            ¡Solicitud aprobada!
          </h1>
          <p className="text-muted-foreground">
            Tu contrato fue firmado exitosamente. El desembolso se realizará en las próximas 24-48 horas.
          </p>
        </div>

        <div className="bg-success-50 border border-success-100 rounded-lg p-4 w-full">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-success-700 shrink-0 mt-0.5" />
            <p className="text-sm text-success-700">
              Recibirás una notificación cuando el dinero esté disponible en tu cuenta.
            </p>
          </div>
        </div>

        <Button onClick={() => router.push('/dashboard')} size="lg" className="w-full">
          <Home className="w-4 h-4 mr-2" />
          Ir al dashboard
        </Button>
      </div>
    </Card>
  );
}

// ── Vista: Expirada ───────────────────────────────────────────────────────────

function ExpiredView({ application }: { application: ApplicationRecord }) {
  const router = useRouter();

  return (
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-warning-50 flex items-center justify-center">
          <Clock className="w-12 h-12 text-warning-700" />
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Solicitud expirada
          </h1>
          <p className="text-muted-foreground">
            Tu solicitud expiró porque no se completaron los pasos requeridos dentro del plazo de 7 días.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 w-full text-left">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              No te preocupes — puedes iniciar una nueva solicitud. Tus datos de perfil se mantienen guardados.
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3">
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
    </Card>
  );
}
