'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getAdminPaymentDeclarationByIdAction,
  approvePaymentDeclarationAction,
  rejectPaymentDeclarationAction,
  getPaymentQuoteAction,
} from '@/app/actions/payment-declaration.actions';
import {
  paymentDeclarationStatusLabels,
  type PaymentDeclarationDetail,
  type PaymentQuote,
} from '@/modules/payment-declarations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="h-6 w-64 bg-neutral-200 rounded" />
      <div className="h-24 bg-neutral-100 rounded-xl border" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-neutral-100 rounded-xl border" />
        <div className="h-64 bg-neutral-100 rounded-xl border" />
      </div>
    </div>
  );
}

// ─── Sección: comparación de montos ────────────────────────────────────────────

function DebtComparison({ detail }: { detail: PaymentDeclarationDetail }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Deuda del crédito (calculada en vivo)</CardTitle>
        <CardDescription>Verifica que el monto declarado calce con la deuda real antes de aprobar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-muted-foreground">Monto declarado</span>
          <span className="text-sm font-semibold">{formatCurrency(detail.declaredAmount)}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-muted-foreground">Deuda de esta cuota</span>
          <span className="text-sm font-medium">{formatCurrency(detail.installmentOutstanding)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm font-medium">Deuda total del crédito</span>
          <span className="text-base font-bold">{formatCurrency(detail.creditOutstandingTotal)}</span>
        </div>
        {detail.exceedsTotalDebt && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>El monto declarado excede la deuda total</AlertTitle>
            <AlertDescription>
              El cliente declaró {formatCurrency(detail.declaredAmount)}, más que la deuda total del crédito
              ({formatCurrency(detail.creditOutstandingTotal)}). Ajusta el monto a aplicar antes de aprobar.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sección: comprobantes ──────────────────────────────────────────────────────

function VouchersSection({ detail }: { detail: PaymentDeclarationDetail }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Comprobantes ({detail.vouchers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail.vouchers.map((voucher) => (
          <div key={voucher.id} className="rounded-lg border overflow-hidden">
            {voucher.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={voucher.photoUrl}
                alt={`Comprobante ${voucher.operationNumber}`}
                className="w-full max-h-96 object-contain bg-muted"
              />
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-muted text-xs text-muted-foreground">
                Sin foto disponible
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
              <span className="text-xs font-mono text-muted-foreground">N.° {voucher.operationNumber}</span>
              <span className="text-xs font-semibold">{formatCurrency(voucher.amount)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Sección: posible duplicado ─────────────────────────────────────────────────

function DuplicateWarning({ detail }: { detail: PaymentDeclarationDetail }) {
  if (!detail.possibleDuplicate) return null;
  return (
    <Alert variant="destructive">
      <Copy className="h-4 w-4" />
      <AlertTitle>Posible comprobante duplicado</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Este comprobante podría coincidir con otra(s) declaración(es) ya existente(s). Revísalas antes de aprobar:
        </p>
        <div className="flex flex-wrap gap-2">
          {detail.duplicateDeclarationIds.map((dupId) => (
            <Link key={dupId} href={`/admin/payment-declarations/${dupId}`}>
              <Badge variant="outline" className="cursor-pointer font-mono text-[10px]">
                #{dupId.slice(-8)}
              </Badge>
            </Link>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ─── Sección: resultado de una declaración ya revisada ──────────────────────────

function ReviewedResult({ detail }: { detail: PaymentDeclarationDetail }) {
  if (detail.status === 'APPROVED') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Aprobada
          </CardTitle>
          <CardDescription>
            {detail.reviewedBy && <>Por {detail.reviewedBy} — </>}
            {detail.reviewedAt ? formatDateTime(detail.reviewedAt) : '—'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-muted-foreground">Monto aplicado</span>
            <span className="text-sm font-semibold">
              {detail.appliedAmount != null ? formatCurrency(detail.appliedAmount) : '—'}
            </span>
          </div>
          {detail.internalNote && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground mb-1">Nota interna</p>
              <p className="text-sm">{detail.internalNote}</p>
            </div>
          )}

          {detail.paymentResult && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">A dónde fue el dinero</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1.5 font-medium text-muted-foreground">Cuota</th>
                        <th className="text-right py-1.5 font-medium text-muted-foreground">A mora</th>
                        <th className="text-right py-1.5 font-medium text-muted-foreground">A capital</th>
                        <th className="text-right py-1.5 font-medium text-muted-foreground">Estado resultante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.paymentResult.distributions.map((d) => (
                        <tr key={d.installmentNo} className="border-b last:border-0">
                          <td className="py-1.5 font-mono text-primary">#{d.installmentNo}</td>
                          <td className="py-1.5 text-right font-mono">{formatCurrency(d.appliedToPenalty)}</td>
                          <td className="py-1.5 text-right font-mono">{formatCurrency(d.appliedToInstallment)}</td>
                          <td className="py-1.5 text-right">
                            <Badge variant="outline" className="text-[10px]">{d.resultingStatus}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-1 pt-2 text-sm">
                  <span className="text-muted-foreground">Total aplicado</span>
                  <span className="font-semibold">{formatCurrency(detail.paymentResult.totalApplied)}</span>
                </div>
                <div className="flex items-center justify-between px-1 text-sm">
                  <span className="text-muted-foreground">Saldo restante del crédito</span>
                  <span className="font-medium">{formatCurrency(detail.paymentResult.remaining)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // REJECTED
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
          <XCircle className="h-4 w-4" /> Rechazada
        </CardTitle>
        <CardDescription>
          {detail.reviewedBy && <>Por {detail.reviewedBy} — </>}
          {detail.reviewedAt ? formatDateTime(detail.reviewedAt) : '—'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {detail.clientMessage && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground mb-1">Mensaje al cliente</p>
            <p className="text-sm">{detail.clientMessage}</p>
          </div>
        )}
        {detail.internalNote && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground mb-1">Nota interna</p>
            <p className="text-sm">{detail.internalNote}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Panel: cotización hasta la cuota objetivo ──────────────────────────────────

/**
 * Muestra cuánto se debe hasta la cuota objetivo, cuota por cuota.
 *
 * <p>Es lo que el admin necesita ver antes de aprobar: si el cliente declaró la cuota 4
 * pero también debe la 2 y la 3, el pago se aplica primero sobre esas. `maximumAllowed`
 * es el tope real que el backend acepta — aprobar por encima devuelve 400 y la
 * declaración queda PENDING.
 */
function PaymentQuotePanel({
  quote,
  error,
  isLoading,
  declaredAmount,
}: {
  quote: PaymentQuote | null;
  error: string | null;
  isLoading: boolean;
  declaredAmount: number;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Calculando la deuda hasta esta cuota...
      </div>
    );
  }

  if (error || !quote) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No se pudo calcular la deuda</AlertTitle>
        <AlertDescription>
          {error ?? 'Intenta recargar la página.'} Podés aprobar igual, pero sin la
          referencia del máximo cobrable.
        </AlertDescription>
      </Alert>
    );
  }

  const included = quote.installments.filter((i) => i.included);
  const declaredExceeds = declaredAmount > quote.maximumAllowed;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Deuda hasta la cuota {quote.targetInstallmentNo}
        </p>
        <span className="text-sm font-semibold">{formatCurrency(quote.maximumAllowed)}</span>
      </div>

      {included.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No hay cuotas cobrables hasta la {quote.targetInstallmentNo} — ya están pagadas o
          refinanciadas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-1 text-left font-medium">Cuota</th>
                <th className="py-1 text-right font-medium">Mora</th>
                <th className="py-1 text-right font-medium">Interés</th>
                <th className="py-1 text-right font-medium">Capital</th>
                <th className="py-1 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {included.map((i) => (
                <tr
                  key={i.installmentNo}
                  className={`border-b last:border-0 ${i.isTarget ? 'font-medium' : ''}`}
                >
                  <td className="py-1 font-mono text-primary">
                    #{i.installmentNo}
                    {i.isTarget && <span className="ml-1 text-[9px] text-muted-foreground">objetivo</span>}
                  </td>
                  <td className="py-1 text-right">{i.penalty > 0 ? formatCurrency(i.penalty) : '—'}</td>
                  <td className="py-1 text-right">{i.interest > 0 ? formatCurrency(i.interest) : '—'}</td>
                  <td className="py-1 text-right">{i.principal > 0 ? formatCurrency(i.principal) : '—'}</td>
                  <td className="py-1 text-right">{formatCurrency(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {declaredExceeds && (
        <p className="text-[11px] text-amber-700">
          El cliente declaró {formatCurrency(declaredAmount)}, más que la deuda cobrable
          hasta esta cuota. Aplicá como máximo {formatCurrency(quote.maximumAllowed)} — el
          excedente se devuelve por fuera del sistema.
        </p>
      )}

      <p className="text-[10px] text-muted-foreground">
        Mora sincronizada al {formatDateTime(quote.penaltyTimestamp)}.
      </p>
    </div>
  );
}

// ─── Sección: acciones (aprobar / rechazar) ─────────────────────────────────────

function ApproveRejectActions({
  detail,
  onUpdated,
}: {
  detail: PaymentDeclarationDetail;
  onUpdated: (updated: PaymentDeclarationDetail) => void;
}) {
  // Cuota objetivo: por defecto la que declaró el cliente, editable por el admin.
  const [targetInstallmentNo, setTargetInstallmentNo] = useState(detail.installmentNo);
  const [targetChangeReason, setTargetChangeReason] = useState('');

  // Cotización del módulo `credit`: cuánto se debe hasta la cuota objetivo, incluyendo
  // las anteriores impagas. Es el tope real que el backend va a aceptar.
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);

  const [appliedAmount, setAppliedAmount] = useState(
    String(Math.min(detail.declaredAmount, detail.creditOutstandingTotal).toFixed(2)),
  );
  const [adminNote, setAdminNote] = useState('');
  const [approveError, setApproveError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const [clientMessage, setClientMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Se recotiza al cambiar la cuota objetivo: el máximo cobrable depende de cuáles
  // cuotas quedan por debajo.
  useEffect(() => {
    let cancelled = false;
    async function loadQuote() {
      setIsLoadingQuote(true);
      setQuoteError(null);
      const result = await getPaymentQuoteAction(detail.creditId, targetInstallmentNo);
      if (cancelled) return;
      if (result.ok) {
        setQuote(result.data);
        // Sugerir lo declarado, topeado por lo que realmente se puede cobrar.
        setAppliedAmount(
          String(Math.min(detail.declaredAmount, result.data.maximumAllowed).toFixed(2)),
        );
      } else {
        setQuote(null);
        setQuoteError(result.error.message);
      }
      setIsLoadingQuote(false);
    }
    loadQuote();
    return () => { cancelled = true; };
  }, [detail.creditId, detail.declaredAmount, targetInstallmentNo]);

  const targetChanged = targetInstallmentNo !== detail.installmentNo;
  const appliedAmountNum = Number(appliedAmount);
  const maximumAllowed = quote?.maximumAllowed ?? null;
  const exceedsMaximum = maximumAllowed !== null && appliedAmountNum > maximumAllowed;
  const exceedsDeclared = appliedAmountNum > detail.declaredAmount;

  const canApprove =
    Number.isFinite(appliedAmountNum)
    && appliedAmountNum > 0
    && !exceedsMaximum
    && !exceedsDeclared
    // El backend exige el motivo si se cambia la cuota — se valida acá para no
    // mandar un request que va a fallar.
    && (!targetChanged || targetChangeReason.trim().length > 0);

  const canReject = clientMessage.trim().length > 0;

  async function handleApprove() {
    if (!canApprove) return;
    setIsApproving(true);
    setApproveError(null);

    const result = await approvePaymentDeclarationAction(detail.id, {
      appliedAmount: appliedAmountNum,
      targetInstallmentNo: targetChanged ? targetInstallmentNo : undefined,
      targetChangeReason: targetChanged ? targetChangeReason.trim() : undefined,
      adminNote: adminNote.trim() || undefined,
    });

    setIsApproving(false);
    if (!result.ok) {
      setApproveError(result.error.message);
      return;
    }
    onUpdated(result.data);
  }

  async function handleReject() {
    if (!canReject) return;
    setIsRejecting(true);
    setRejectError(null);

    const result = await rejectPaymentDeclarationAction(detail.id, {
      clientMessage: clientMessage.trim(),
      internalNote: internalNote.trim() || undefined,
    });

    setIsRejecting(false);
    if (!result.ok) {
      setRejectError(result.error.message);
      return;
    }
    onUpdated(result.data);
  }

  return (
    <div className="space-y-4">
      {/* Aprobar */}
      <Card className="border-emerald-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Aprobar declaración
          </CardTitle>
          <CardDescription>
            El pago se aplica en orden sobre las cuotas cobrables hasta la objetivo — mora,
            interés y capital, de la más antigua a la más nueva. Nunca toca cuotas posteriores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Cuota objetivo — el admin puede corregir la que declaró el cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="targetInstallmentNo" className="text-xs">
              Cuota objetivo
              {!targetChanged && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  (declarada por el cliente)
                </span>
              )}
            </Label>
            <Input
              id="targetInstallmentNo"
              type="number"
              min="1"
              step="1"
              value={targetInstallmentNo}
              onChange={(e) => setTargetInstallmentNo(Math.max(1, Number(e.target.value) || 1))}
              disabled={isApproving}
            />
          </div>

          {targetChanged && (
            <div className="space-y-1.5">
              <Label htmlFor="targetChangeReason" className="text-xs">
                Motivo del cambio de cuota (obligatorio)
              </Label>
              <Textarea
                id="targetChangeReason"
                placeholder="Ej: el cliente declaró la cuota 4 pero el depósito corresponde a la 2."
                value={targetChangeReason}
                onChange={(e) => setTargetChangeReason(e.target.value)}
                disabled={isApproving}
                rows={2}
              />
            </div>
          )}

          {/* Desglose de la deuda hasta la cuota objetivo */}
          <PaymentQuotePanel
            quote={quote}
            error={quoteError}
            isLoading={isLoadingQuote}
            declaredAmount={detail.declaredAmount}
          />

          <div className="space-y-1.5">
            <Label htmlFor="appliedAmount" className="text-xs">Monto a aplicar</Label>
            <Input
              id="appliedAmount"
              type="number"
              step="0.01"
              min="0"
              value={appliedAmount}
              onChange={(e) => setAppliedAmount(e.target.value)}
              disabled={isApproving}
              aria-invalid={exceedsMaximum || exceedsDeclared}
            />
            {exceedsDeclared && (
              <p className="text-[11px] text-destructive">
                No puede superar lo declarado por el cliente ({formatCurrency(detail.declaredAmount)}).
              </p>
            )}
            {exceedsMaximum && !exceedsDeclared && maximumAllowed !== null && (
              <p className="text-[11px] text-destructive">
                Excede la deuda cobrable hasta la cuota {targetInstallmentNo}
                {' '}({formatCurrency(maximumAllowed)}). El backend lo rechazaría.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adminNote" className="text-xs">Nota interna (opcional)</Label>
            <Textarea
              id="adminNote"
              placeholder="Solo visible para el equipo admin"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              disabled={isApproving}
              rows={2}
            />
          </div>

          {approveError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No se pudo aprobar</AlertTitle>
              <AlertDescription>{approveError}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleApprove}
            disabled={!canApprove || isApproving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isApproving ? 'Aprobando...' : 'Aprobar y aplicar pago'}
          </Button>
        </CardContent>
      </Card>

      {/* Rechazar */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" /> Rechazar declaración
          </CardTitle>
          <CardDescription>El cliente verá el mensaje que escribas aquí.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showRejectForm ? (
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowRejectForm(true)}>
              Rechazar comprobante
            </Button>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="clientMessage" className="text-xs">Mensaje para el cliente (obligatorio)</Label>
                <Textarea
                  id="clientMessage"
                  placeholder="Ej: La foto del comprobante no es legible, súbela de nuevo."
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  disabled={isRejecting}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="internalNote" className="text-xs">Nota interna (opcional)</Label>
                <Textarea
                  id="internalNote"
                  placeholder="Solo visible para el equipo admin"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  disabled={isRejecting}
                  rows={2}
                />
              </div>

              {rejectError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No se pudo rechazar</AlertTitle>
                  <AlertDescription>{rejectError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!canReject || isRejecting}
                  className="gap-2"
                >
                  {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  {isRejecting ? 'Rechazando...' : 'Confirmar rechazo'}
                </Button>
                <Button variant="outline" onClick={() => setShowRejectForm(false)} disabled={isRejecting}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AdminPaymentDeclarationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<PaymentDeclarationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const result = await getAdminPaymentDeclarationByIdAction(id);
      if (result.ok) {
        setDetail(result.data);
        setError(null);
      } else {
        setError(result.error.message);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (error || !detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Receipt className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error ?? 'Declaración no encontrada'}</p>
        <Link href="/admin/payment-declarations">
          <Button variant="outline" size="sm">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/payment-declarations" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Declaración de pago</h1>
            <p className="text-xs text-muted-foreground font-mono">#{detail.id.slice(-8)}</p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[detail.status] ?? 'outline'} className="ml-auto">
          {paymentDeclarationStatusLabels[detail.status]}
        </Badge>
      </div>

      {/* Info general */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Crédito</p>
              <Link href={`/admin/credits/${detail.creditId}`} className="text-primary hover:underline font-mono text-xs">
                #{detail.creditId.slice(-8)}
              </Link>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Cuota</p>
              <p className="text-xs font-medium">#{detail.installmentNo}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Usuario</p>
              <p className="text-xs font-mono">{detail.userId.slice(-8)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Declarada el</p>
              <p className="text-xs">{formatDateTime(detail.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {detail.status === 'PENDING' && (
        <Alert>
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700">Pendiente de revisión</AlertTitle>
          <AlertDescription>Revisa los comprobantes y la deuda del crédito antes de aprobar o rechazar.</AlertDescription>
        </Alert>
      )}

      <DuplicateWarning detail={detail} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-6">
          <DebtComparison detail={detail} />
          <VouchersSection detail={detail} />
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-6">
          {detail.status === 'PENDING' ? (
            <ApproveRejectActions detail={detail} onUpdated={setDetail} />
          ) : (
            <ReviewedResult detail={detail} />
          )}
        </div>
      </div>
    </div>
  );
}
