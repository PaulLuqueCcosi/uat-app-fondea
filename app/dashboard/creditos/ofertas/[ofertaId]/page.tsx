'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileSignature,
  CalendarDays,
  Check,
  AlertCircle,
  PenLine,
  Loader2,
  Clock,
  XCircle,
  CheckCircle,
  PartyPopper,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SignaturePad from '@/components/ui/signature-pad';
import { NegotiationDocumentsViewer } from '@/components/negotiation/NegotiationDocumentsViewer';
import {
  getNegotiationOfferByIdAction,
  acceptNegotiationOfferAction,
  rejectNegotiationOfferAction,
} from '@/app/actions/negotiation-offer.actions';
import { useNegotiationOfferPolling } from '@/hooks/useNegotiationOfferPolling';
import {
  isOfferSignable,
  isOfferStaleExpired,
  negotiationOfferStatusLabels,
  type NegotiationOffer,
  type NegotiationOfferDetail,
} from '@/modules/negotiation-offers';
import { formatBackendDate, formatBackendDateShort, parseBackendDate } from '@/modules/shared/backend-date';
import { useBreadcrumbLabel } from '@/modules/shared/breadcrumb-labels';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return parseBackendDate(iso).toLocaleString('es-PE', {
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const statusBadgeVariant: Record<string, 'warning' | 'success' | 'error' | 'pending'> = {
  SENT: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'pending',
};

type ViewStep = 'review' | 'reject-confirm' | 'signing' | 'sign-error' | 'processing';

/** Subtítulo del header según el estado de la oferta. */
function headerSubtitle(offer: NegotiationOffer): string {
  switch (offer.status) {
    case 'ACCEPTED':
      return offer.respondedAt ? `Firmada el ${formatDateTime(offer.respondedAt)}` : 'Oferta firmada';
    case 'REJECTED':
      return offer.respondedAt ? `Rechazada el ${formatDateTime(offer.respondedAt)}` : 'Oferta rechazada';
    case 'EXPIRED':
      return `El plazo para firmar venció el ${formatDateTime(offer.signDeadline)}`;
    default:
      return `Firma antes del ${formatDateTime(offer.signDeadline)} para aceptar esta propuesta`;
  }
}

// ─── Piezas de UI ─────────────────────────────────────────────────────────────

type Tone = 'success' | 'error' | 'warning' | 'neutral' | 'primary';

const toneIcon: Record<Tone, string> = {
  success: 'bg-success-100 text-success-700',
  error: 'bg-error-100 text-error-700',
  warning: 'bg-warning-100 text-warning-700',
  neutral: 'bg-neutral-100 text-muted-foreground',
  primary: 'bg-primary-100 text-primary-700',
};

/**
 * Tarjeta de estado: siempre blanca (como el resto del dashboard), el color va
 * solo en el círculo del ícono — nada de fondos translúcidos sobre el layout.
 */
function StatusCard({
  tone,
  icon,
  title,
  description,
  action,
}: {
  tone: Tone;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneIcon[tone]}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardContent>
    </Card>
  );
}

/** Resumen de la oferta: mismos tiles que el banner del home y ActiveLoanCard. */
function OfferSummary({ offer }: { offer: NegotiationOffer }) {
  const count = offer.schedule.length;
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-md border border-primary-200 bg-primary-50 p-2.5">
        <p className="text-xs text-primary-700 mb-0.5">Total refinanciado</p>
        <p className="text-sm sm:text-base font-bold text-primary-800">{formatCurrency(offer.totalAmount)}</p>
      </div>
      <div className="rounded-md border border-border bg-background p-2.5">
        <p className="text-xs text-muted-foreground mb-0.5">Cuotas</p>
        <p className="text-sm sm:text-base font-bold text-foreground">
          {count} cuota{count !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="rounded-md border border-border bg-background p-2.5">
        <p className="text-xs text-muted-foreground mb-0.5">Primera cuota</p>
        <p className="text-sm sm:text-base font-bold text-foreground">
          {formatBackendDateShort(offer.schedule[0]?.dueDate)}
        </p>
      </div>
    </div>
  );
}

/** Cronograma: filas con número en círculo, como la lista de cuotas del crédito. */
function OfferSchedule({ offer }: { offer: NegotiationOffer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          {offer.status === 'ACCEPTED' ? 'Tu nuevo cronograma' : 'Cronograma propuesto'}
        </CardTitle>
        <CardDescription>
          {offer.schedule.length} cuota{offer.schedule.length !== 1 ? 's' : ''} que reemplazan tu cuota vencida
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OfferSummary offer={offer} />
        <div className="space-y-2">
          {offer.schedule.map((item) => (
            <div
              key={item.installmentNo}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  {item.installmentNo}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Cuota {item.installmentNo}</p>
                  <p className="text-xs text-muted-foreground">Vence el {formatBackendDate(item.dueDate)}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OfferDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="h-4 w-28 bg-neutral-200 rounded" />
      <div className="h-7 w-64 bg-neutral-200 rounded" />
      <div className="h-24 bg-card rounded-xl border" />
      <div className="h-64 bg-card rounded-xl border" />
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NegotiationOfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.ofertaId as string;

  const [detail, setDetail] = useState<NegotiationOfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<ViewStep>('review');
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [signError, setSignError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const polling = useNegotiationOfferPolling();

  useBreadcrumbLabel(offerId, detail ? `Oferta del ${formatBackendDateShort(detail.offer.createdAt)}` : null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const result = await getNegotiationOfferByIdAction(offerId);
      if (result.ok) {
        setDetail(result.data);
      } else {
        setLoadError(result.error.message);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [offerId]);

  async function handleSign() {
    if (!detail) return;

    if (!accepted) {
      setSignError('Debes aceptar los términos de la oferta');
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 5) {
      setSignError('Ingresa tu nombre completo para firmar');
      return;
    }
    if (!signature) {
      setSignError('Debes dibujar tu firma para continuar');
      return;
    }

    setStep('signing');
    setSignError('');

    const result = await acceptNegotiationOfferAction(offerId, {
      signedName: fullName.trim(),
      signatureImage: signature,
    });

    if (!result.ok) {
      setSignError(result.error.message);
      setStep('sign-error');
      return;
    }

    // La firma se aplicó. Si ya vino el crédito resultante (raro pero posible), listo.
    if (result.data.resultingCreditId) {
      setStep('review');
      setDetail((prev) => (prev ? { ...prev, offer: result.data } : prev));
      return;
    }

    // Crédito aún no creado — polling acotado (~20s)
    setStep('processing');
    setDetail((prev) => (prev ? { ...prev, offer: result.data } : prev));
    polling.start(offerId);
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    const result = await rejectNegotiationOfferAction(offerId, { reason: rejectReason.trim() });
    setRejecting(false);
    if (result.ok) {
      setDetail((prev) => (prev ? { ...prev, offer: result.data } : prev));
      setStep('review');
    }
  }

  if (loading) return <OfferDetailSkeleton />;

  if (loadError || !detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <FileSignature className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{loadError ?? 'Oferta no encontrada'}</p>
        <Link href="/dashboard/creditos/ofertas">
          <Button variant="outline" size="sm">Volver a ofertas</Button>
        </Link>
      </div>
    );
  }

  const { offer, documents } = detail;
  const signable = isOfferSignable(offer);
  const staleExpired = isOfferStaleExpired(offer);

  // ─── Resultado del crédito creado ──────────────────────────────────────────
  const resultingCreditId = offer.resultingCreditId ?? polling.resultingCreditId;
  const isProcessing = step === 'processing' && (polling.state === 'polling' || polling.state === 'idle');
  const isTimedOut = step === 'processing' && (polling.state === 'timed-out' || polling.state === 'error');
  const isDone = step === 'processing' && polling.state === 'resolved';

  const goToCreditButton = (creditId: string, label: string) => (
    <Button className="gap-1.5 w-full sm:w-auto" onClick={() => router.push(`/dashboard/creditos/${creditId}`)}>
      {label}
      <ChevronRight className="w-4 h-4" />
    </Button>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link
        href="/dashboard/creditos/ofertas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Ofertas de refinanciamiento
      </Link>

      {/* ─── Header ─── */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Oferta de refinanciamiento</h1>
          <Badge variant={statusBadgeVariant[offer.status]}>
            {negotiationOfferStatusLabels[offer.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{headerSubtitle(offer)}</p>
      </div>

      {/* ─── Plazo vencido (status aún SENT en BD pero ya pasó la fecha) ─── */}
      {staleExpired && (
        <StatusCard
          tone="warning"
          icon={<Clock className="w-5 h-5" />}
          title="El plazo para firmar venció"
          description={<>Venció el {formatDateTime(offer.signDeadline)}. Contacta a soporte si necesitas una nueva propuesta.</>}
        />
      )}

      {/* ─── Procesando (polling) ─── */}
      {isProcessing && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                <Loader2 className="w-7 h-7 text-primary-700 animate-spin" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Estamos creando tu nuevo crédito…</p>
                <p className="mt-1 text-sm text-muted-foreground">Esto normalmente toma solo unos segundos. No cierres esta página.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Tardó demasiado (timeout del polling) ─── */}
      {isTimedOut && (
        <StatusCard
          tone="warning"
          icon={<AlertCircle className="w-5 h-5" />}
          title="Esto está tardando más de lo normal"
          description={
            <>
              Tu firma se registró correctamente, pero tu crédito aún no se termina de crear. Si en unos minutos
              no lo ves en <Link href="/dashboard/creditos" className="font-medium text-primary underline">Mis Créditos</Link>,
              contacta a soporte.
            </>
          }
          action={
            <Button variant="outline" size="sm" onClick={() => polling.start(offerId)}>
              Verificar de nuevo
            </Button>
          }
        />
      )}

      {/* ─── Listo — crédito creado tras firmar ─── */}
      {isDone && resultingCreditId && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
                <PartyPopper className="w-7 h-7 text-success-700" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">¡Tu nuevo crédito está listo!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Firmaste la oferta y tu cuota vencida quedó refinanciada.
                </p>
              </div>
              {goToCreditButton(resultingCreditId, 'Ver mi nuevo crédito')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Ya aceptada (revisita a la página) ─── */}
      {offer.status === 'ACCEPTED' && step === 'review' && (
        <StatusCard
          tone="success"
          icon={<CheckCircle className="w-5 h-5" />}
          title="Firmaste esta oferta"
          description={
            offer.resultingCreditId
              ? 'Tu cuota vencida quedó refinanciada. Ahora pagas según el nuevo cronograma.'
              : 'Tu crédito se está creando — revisa Mis Créditos en unos momentos.'
          }
          action={offer.resultingCreditId ? goToCreditButton(offer.resultingCreditId, 'Ver mi nuevo crédito') : undefined}
        />
      )}

      {/* ─── Rechazada ─── */}
      {offer.status === 'REJECTED' && step === 'review' && (
        <StatusCard
          tone="error"
          icon={<XCircle className="w-5 h-5" />}
          title="Rechazaste esta oferta"
          description={offer.rejectionReason ? <>Motivo: {offer.rejectionReason}</> : undefined}
        />
      )}

      {/* ─── Expirada ─── */}
      {offer.status === 'EXPIRED' && step === 'review' && (
        <StatusCard
          tone="neutral"
          icon={<Clock className="w-5 h-5" />}
          title="Esta oferta expiró"
          description="No se firmó dentro del plazo. Contacta a soporte si necesitas una nueva propuesta."
        />
      )}

      {/* ─── Cronograma + resumen (en todos los estados, salvo mientras se procesa la firma) ─── */}
      {step !== 'signing' && step !== 'processing' && <OfferSchedule offer={offer} />}

      {/* ─── Documentos firmados ─── */}
      {offer.status === 'ACCEPTED' && step === 'review' && documents.length > 0 && (
        <NegotiationDocumentsViewer key="signed" offerId={offerId} documents={documents} isSigned={true} />
      )}

      {/* ─── Revisar + firmar (solo si sigue vigente) ─── */}
      {step === 'review' && signable && (
        <>
          {documents.length > 0 && (
            <NegotiationDocumentsViewer key="pre-sign" offerId={offerId} documents={documents} isSigned={false} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="w-5 h-5 text-primary" />
                Firma digital
              </CardTitle>
              <CardDescription>Revisa el acuerdo, acepta los términos y firma para refinanciar tu cuota.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer group">
                <div className="relative shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="w-5 h-5 border-2 border-border rounded checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  />
                  {accepted && <Check className="w-3 h-3 text-white absolute top-1 left-1 pointer-events-none" />}
                </div>
                <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                  He leído y acepto el cronograma propuesto y los documentos de refinanciamiento.
                </p>
              </label>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                  Nombre completo
                </label>
                <Input
                  id="fullName"
                  placeholder="Ej: Juana María Pérez Gómez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tu firma</label>
                <SignaturePad value={signature} onChange={setSignature} />
              </div>

              {signError && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700">{signError}</p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={() => setStep('reject-confirm')}>
                  Rechazar oferta
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSign}
                  disabled={!accepted || !fullName.trim() || !signature}
                >
                  Firmar y aceptar
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Firmando ─── */}
      {step === 'signing' && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                <Loader2 className="w-7 h-7 text-primary-700 animate-spin" />
              </div>
              <p className="text-base font-semibold text-foreground">Firmando oferta…</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Error al firmar ─── */}
      {step === 'sign-error' && (
        <StatusCard
          tone="error"
          icon={<XCircle className="w-5 h-5" />}
          title="No se pudo firmar la oferta"
          description={signError}
          action={
            <Button variant="outline" size="sm" onClick={() => setStep('review')}>
              Intentar de nuevo
            </Button>
          }
        />
      )}

      {/* ─── Confirmar rechazo ─── */}
      {step === 'reject-confirm' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-error-100">
                <AlertCircle className="w-4 h-4 text-error-700" />
              </span>
              ¿Por qué rechazas esta oferta?
            </CardTitle>
            <CardDescription>Cuéntanos el motivo para buscar una alternativa que te funcione.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Ej: No puedo pagar ese monto mensual"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => setStep('review')}>
                Volver
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-error-300 text-error-700 hover:bg-error-50"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
              >
                {rejecting ? 'Rechazando…' : 'Confirmar rechazo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
