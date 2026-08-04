'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileSignature,
  FileText,
  Download,
  Check,
  AlertCircle,
  PenLine,
  Loader2,
  Clock,
  XCircle,
  CheckCircle,
  PartyPopper,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import SignaturePad from '@/components/ui/signature-pad';
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
  type NegotiationOfferDetail,
} from '@/modules/negotiation-offers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OfferDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="h-4 w-28 bg-neutral-200 rounded" />
      <div className="h-7 w-64 bg-neutral-200 rounded" />
      <div className="h-40 bg-neutral-50 rounded-xl border" />
      <div className="h-64 bg-neutral-50 rounded-xl border" />
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link
        href="/dashboard/creditos/ofertas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Ofertas de refinanciamiento
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-foreground">Oferta de refinanciamiento</h1>
        <Badge variant={statusBadgeVariant[offer.status]}>
          {negotiationOfferStatusLabels[offer.status]}
        </Badge>
      </div>

      {/* ─── Alerta de plazo vencido (status aún SENT en BD pero ya pasó la fecha) ─── */}
      {staleExpired && (
        <Card className="border-warning-200 bg-warning-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="w-5 h-5 text-warning-600 shrink-0" />
            <p className="text-sm text-warning-800">
              El plazo para firmar esta oferta venció el {formatDateTime(offer.signDeadline)}.
              Contacta a soporte si necesitas una nueva propuesta.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Estado: procesando (polling) ─── */}
      {isProcessing && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Estamos creando tu nuevo crédito...</p>
              <p className="text-xs text-muted-foreground">Esto normalmente toma solo unos segundos. No cierres esta página.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Estado: tardó demasiado (timeout del polling) ─── */}
      {isTimedOut && (
        <Card className="border-warning-200 bg-warning-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-warning-900">
              <AlertCircle className="w-4 h-4 text-warning-700" />
              Esto está tardando más de lo normal
            </CardTitle>
            <CardDescription className="text-warning-700">
              Tu firma se registró correctamente, pero la creación del crédito aún no se completó.
              Te avisaremos apenas esté listo — si en unos minutos no ves tu nuevo crédito en{' '}
              <Link href="/dashboard/creditos" className="underline font-medium">Mis Créditos</Link>, contacta a soporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => polling.start(offerId)}>
              Verificar de nuevo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Estado: listo — crédito creado ─── */}
      {isDone && resultingCreditId && (
        <Card className="border-success-200 bg-success-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-success-900">
              <PartyPopper className="w-5 h-5 text-success-700" />
              ¡Tu nuevo crédito está listo!
            </CardTitle>
            <CardDescription className="text-success-700">
              La oferta fue firmada y tu crédito de refinanciamiento ya se creó.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="bg-accent-500 text-accent-900 hover:bg-accent-400"
              onClick={() => router.push(`/dashboard/creditos/${resultingCreditId}`)}
            >
              Ver mi nuevo crédito
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Ya aceptada (revisita a la página, sin necesidad de firmar de nuevo) ─── */}
      {offer.status === 'ACCEPTED' && step === 'review' && (
        <Card className="border-success-200 bg-success-50/30">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="w-5 h-5 text-success-700 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-success-900">Ya firmaste esta oferta</p>
              <p className="text-xs text-success-700">
                {offer.resultingCreditId
                  ? 'Tu crédito de refinanciamiento ya está disponible.'
                  : 'Tu crédito se está creando — revisa Mis Créditos en unos momentos.'}
              </p>
            </div>
            {offer.resultingCreditId && (
              <Link href={`/dashboard/creditos/${offer.resultingCreditId}`}>
                <Button size="sm" variant="outline">Ver crédito</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Ya rechazada ─── */}
      {offer.status === 'REJECTED' && step === 'review' && (
        <Card className="border-error-200 bg-error-50/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-error-600 shrink-0" />
              <p className="text-sm font-medium text-error-900">Rechazaste esta oferta</p>
            </div>
            {offer.rejectionReason && (
              <p className="text-xs text-error-700 mt-2 pl-8">Motivo: {offer.rejectionReason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Expirada ─── */}
      {offer.status === 'EXPIRED' && step === 'review' && (
        <Card className="border-neutral-200 bg-neutral-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Esta oferta expiró sin respuesta. Contacta a soporte si necesitas una nueva.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Vista principal: revisar + firmar (solo si sigue vigente y en review) ─── */}
      {step === 'review' && signable && (
        <>
          {/* Cronograma propuesto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                Cronograma propuesto
              </CardTitle>
              <CardDescription>
                Firma antes del {formatDateTime(offer.signDeadline)} para aceptar esta propuesta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {offer.schedule.map((item) => (
                <div key={item.installmentNo} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">
                    Cuota {item.installmentNo} · {formatDate(item.dueDate)}
                  </span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">{formatCurrency(offer.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Documentos a revisar */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Documentos a revisar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{doc.name}</span>
                    </div>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          Ver documento
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Disponible al firmar</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Aceptación de términos */}
          <Card>
            <CardContent className="py-4">
              <label className="flex items-start gap-3 cursor-pointer group">
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
            </CardContent>
          </Card>

          {/* Firma */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PenLine className="w-4 h-4 text-primary" />
                Firma digital
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('reject-confirm')}
                >
                  Rechazar oferta
                </Button>
                <Button
                  className="flex-1 bg-accent-500 text-accent-900 hover:bg-accent-400"
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

      {/* ─── Firmando (loading) ─── */}
      {step === 'signing' && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Firmando oferta...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Error al firmar ─── */}
      {step === 'sign-error' && (
        <Card className="border-error-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-error-900">
              <XCircle className="w-4 h-4 text-error-600" />
              No se pudo firmar la oferta
            </CardTitle>
            <CardDescription className="text-error-700">{signError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => setStep('review')}>
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Confirmar rechazo ─── */}
      {step === 'reject-confirm' && (
        <Card className="border-error-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-error-900">
              <AlertCircle className="w-4 h-4 text-error-600" />
              ¿Por qué rechazas esta oferta?
            </CardTitle>
            <CardDescription>
              Cuéntanos el motivo — el admin podrá crear una nueva propuesta si es necesario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Ej: No puedo pagar ese monto mensual"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('review')}>
                Volver
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-error-300 text-error-700 hover:bg-error-50"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
              >
                {rejecting ? 'Rechazando...' : 'Confirmar rechazo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
