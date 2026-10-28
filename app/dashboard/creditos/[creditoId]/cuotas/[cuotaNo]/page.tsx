'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  CreditCard,
  XCircle,
  Loader2,
  ImageIcon,
  Plus,
  Send,
  Hourglass,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getInstallmentByNoAction,
  getCreditByIdAction,
} from '@/app/actions/credit.actions';
import {
  submitPaymentDeclarationAction,
  listMyPaymentDeclarationsAction,
  getMyPaymentDeclarationByIdAction,
} from '@/app/actions/payment-declaration.actions';
import type {
  Installment,
  Credit,
  InstallmentViewStatusInfo,
} from '@/modules/credits';
import { getInstallmentViewStatus } from '@/modules/credits';
import { formatBackendDateLong } from '@/modules/shared/backend-date';
import type { PaymentDeclaration, MyPaymentDeclarationDetail } from '@/modules/payment-declarations';
import { getActiveDepositAccountAction } from '@/app/actions/deposit-account.actions';
import type { DepositAccountConfig, DepositAccountError } from '@/modules/deposit-account';
import { DepositAccountCard } from '@/components/credits/DepositAccountCard';
import { InstallmentBalance } from '@/components/credits/InstallmentBalance';
import { useBreadcrumbLabel } from '@/modules/shared/breadcrumb-labels';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Ver `modules/shared/backend-date` — un LocalDate del backend parseado con `new Date()`
// muestra el día anterior en Perú.
const formatDate = formatBackendDateLong;

// El badge y su variante salen de `getInstallmentViewStatus` — antes había acá un Record
// propio por status que no contemplaba "en revisión".

// ─── Declaración de pago — comprobantes ───────────────────────────────────────

const MAX_VOUCHERS = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];

interface VoucherRow {
  key: number;
  file: File | null;
  fileError: string | null;
  operationNumber: string;
  amount: string;
}

function validateVoucherFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Solo se permiten imágenes JPEG o PNG.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'La imagen no debe superar los 10MB.';
  }
  return null;
}

function isVoucherRowValid(row: VoucherRow): boolean {
  if (!row.file || row.fileError) return false;
  if (!row.operationNumber.trim()) return false;
  const amountNum = Number(row.amount);
  return Number.isFinite(amountNum) && amountNum > 0;
}

// ─── Payment flow steps ───────────────────────────────────────────────────────

type PaymentStep = 'declare' | 'submitting' | 'error';

/** Badge por status de una declaración, para el historial de comprobantes. */
const DECLARATION_STATUS_BADGE: Record<PaymentDeclaration['status'], { label: string; variant: 'success' | 'error' | 'pending' }> = {
  APPROVED: { label: 'Aprobado', variant: 'success' },
  REJECTED: { label: 'Rechazado', variant: 'error' },
  PENDING: { label: 'En revisión', variant: 'pending' },
};


// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CuotaDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="h-4 w-36 bg-neutral-200 rounded" />
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 bg-neutral-200 rounded" />
        <div className="h-5 w-20 bg-neutral-200 rounded-full" />
      </div>
      <div className="h-20 bg-neutral-100 rounded-xl border" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-neutral-100 rounded-xl border" />
        <div className="h-56 bg-neutral-100 rounded-xl border" />
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CuotaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const cuotaNo = Number(params.cuotaNo);
  const creditoId = params.creditoId as string;

  const [cuota, setCuota] = useState<Installment | null>(null);
  const [credit, setCredit] = useState<Credit | null>(null);
  useBreadcrumbLabel(creditoId, credit?.creditCode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODAS las declaraciones de pago hechas para esta cuota (no solo la última) — más
  // recientes primero, según el orden que ya trae el backend. Antes solo se guardaba la más
  // reciente, así que una vez que la cuota quedaba PAGADA (o la declaración vigente pasaba a
  // ser otra) el historial completo de comprobantes enviados — incluidos los rechazados —
  // desaparecía por completo de la vista, sin ningún lugar donde volver a verlo.
  const [installmentDeclarations, setInstallmentDeclarations] = useState<PaymentDeclaration[]>([]);
  // Detalle CON las fotos de cada comprobante, por id de declaración — se pide aparte porque
  // el listado nunca trae fotos (evita generar URLs prefirmadas para cada fila de una lista
  // paginada). Antes el cliente veía "1 comprobante, S/300" sin poder volver a ver la foto.
  const [declarationDetails, setDeclarationDetails] = useState<Record<string, MyPaymentDeclarationDetail>>({});
  const [loadingDeclarationDetails, setLoadingDeclarationDetails] = useState(false);

  // La declaración PENDING (si hay una) es la que gatilla la vista "en revisión" del
  // formulario. La más reciente de TODAS (independiente del status) es la que se usa para
  // el banner de "tu comprobante anterior fue rechazado" antes del formulario.
  const pendingDeclaration = installmentDeclarations.find((d) => d.status === 'PENDING') ?? null;
  const mostRecentDeclaration = installmentDeclarations[0] ?? null;

  // Cuenta a la que el cliente tiene que transferir. Se guarda también el error para
  // poder explicarle por qué no la ve (ej. el admin no configuró ninguna) en vez de
  // mostrarle el formulario sin decirle a dónde depositar.
  const [depositAccount, setDepositAccount] = useState<DepositAccountConfig | null>(null);
  const [depositAccountError, setDepositAccountError] = useState<DepositAccountError | null>(null);

  // Payment declaration state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('declare');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nextVoucherKeyRef = useRef(1);
  const [voucherRows, setVoucherRows] = useState<VoucherRow[]>([
    { key: 0, file: null, fileError: null, operationNumber: '', amount: '' },
  ]);

  // Extraído del useEffect para poder llamarlo también después de declarar un pago — así la
  // vista de "recién declarado" es EXACTAMENTE la misma que la de "recargué la página", en
  // vez de una tarjeta de éxito aparte que se veía distinta a lo que quedaba tras el reload.
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    const [cuotaRes, creditRes, declarationsRes, depositAccountRes] = await Promise.all([
      getInstallmentByNoAction(creditoId, cuotaNo),
      getCreditByIdAction(creditoId),
      listMyPaymentDeclarationsAction(0, 50),
      getActiveDepositAccountAction(),
    ]);
    if (cuotaRes.ok) {
      setCuota(cuotaRes.data);
      // El monto del primer comprobante arranca con lo que falta pagar, para que el cliente
      // no lo tipee (sigue editable). Solo si todavía está vacío: no pisa lo que ya escribió.
      const pending = cuotaRes.data.outstanding;
      if (pending > 0) {
        setVoucherRows((rows) =>
          rows.length === 1 && rows[0].amount === ''
            ? [{ ...rows[0], amount: pending.toFixed(2) }]
            : rows,
        );
      }
    } else {
      setError(cuotaRes.error.message);
    }
    if (creditRes.ok) {
      setCredit(creditRes.data);
    }
    if (declarationsRes.ok) {
      // TODAS las declaraciones de esta cuota, no solo la vigente — para poder mostrar el
      // historial completo (incluidos rechazos previos) independientemente del estado
      // actual de la cuota. Ya vienen más recientes primero desde el backend.
      const matches = declarationsRes.data.items.filter(
        (d) => d.creditId === creditoId && d.installmentNo === cuotaNo,
      );
      setInstallmentDeclarations(matches);
    }
    if (depositAccountRes.ok) {
      setDepositAccount(depositAccountRes.data);
    } else {
      setDepositAccountError(depositAccountRes.error);
    }
    setLoading(false);
  }, [creditoId, cuotaNo]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Fotos de los comprobantes — pedidas aparte (ver comentario en el estado), una por cada
  // declaración de esta cuota, sin importar su status (PENDING/APPROVED/REJECTED): el
  // historial se ve completo siempre, no solo mientras hay algo pendiente de revisar.
  const declarationIds = installmentDeclarations.map((d) => d.id).join(',');
  useEffect(() => {
    if (!declarationIds) {
      setDeclarationDetails({});
      return;
    }
    let cancelled = false;
    async function fetchPhotos() {
      setLoadingDeclarationDetails(true);
      const ids = declarationIds.split(',');
      const results = await Promise.all(ids.map((id) => getMyPaymentDeclarationByIdAction(id)));
      if (!cancelled) {
        const map: Record<string, MyPaymentDeclarationDetail> = {};
        results.forEach((res) => { if (res.ok) map[res.data.id] = res.data; });
        setDeclarationDetails(map);
        setLoadingDeclarationDetails(false);
      }
    }
    fetchPhotos();
    return () => { cancelled = true; };
  }, [declarationIds]);

  // ─── Voucher row handlers ─────────────────────────────────────────────────

  function addVoucherRow() {
    setVoucherRows((rows) => {
      if (rows.length >= MAX_VOUCHERS) return rows;
      const key = nextVoucherKeyRef.current++;
      return [...rows, { key, file: null, fileError: null, operationNumber: '', amount: '' }];
    });
  }

  function removeVoucherRow(key: number) {
    setVoucherRows((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));
  }

  function updateVoucherRow(key: number, patch: Partial<VoucherRow>) {
    setVoucherRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleVoucherFileChange(key: number, file: File | null) {
    if (!file) {
      updateVoucherRow(key, { file: null, fileError: null });
      return;
    }
    const err = validateVoucherFile(file);
    updateVoucherRow(key, err ? { file: null, fileError: err } : { file, fileError: null });
  }

  const declaredTotal = voucherRows.reduce((sum, r) => {
    const n = Number(r.amount);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);

  const canSubmitDeclaration = voucherRows.every(isVoucherRowValid);

  // Feedback en vivo del formulario: cuánto falta o sobra vs. el pendiente de esta cuota.
  const declaredVsOutstandingDiff = declaredTotal - (cuota?.outstanding ?? 0);
  const isExactDeclaredMatch = Math.abs(declaredVsOutstandingDiff) < 0.01;

  // ─── Submit handler ───────────────────────────────────────────────────────

  async function handleSubmitDeclaration() {
    if (!cuota || !canSubmitDeclaration) return;

    setPaymentStep('submitting');
    setSubmitError(null);

    const formData = new FormData();
    formData.append('creditId', creditoId);
    formData.append('installmentNo', String(cuotaNo));
    voucherRows.forEach((row) => {
      if (row.file) formData.append('photos', row.file);
      formData.append('operationNumbers', row.operationNumber.trim());
      formData.append('amounts', row.amount);
    });

    const result = await submitPaymentDeclarationAction(formData);

    if (result.ok) {
      // Antes esto mostraba una tarjeta de "éxito" hecha aparte (monto, cantidad de
      // comprobantes, un par de botones) — visualmente distinta de la vista "en revisión"
      // que se ve al recargar la página. En vez de mantener dos vistas para el mismo estado,
      // se vuelve a pedir todo (fetchDetail) para terminar exactamente en el mismo lugar que
      // un reload: la tarjeta "Comprobante en revisión" + "Lo que enviaste" con las fotos.
      toast.success('Declaración enviada — queda pendiente de revisión');
      setVoucherRows([{ key: 0, file: null, fileError: null, operationNumber: '', amount: '' }]);
      await fetchDetail();
      setPaymentStep('declare');
    } else {
      setSubmitError(result.error.message);
      setPaymentStep('error');
    }
  }

  if (loading) return <CuotaDetailSkeleton />;

  if (error || !cuota) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <CreditCard className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error ?? 'Cuota no encontrada'}</p>
        <Link href={`/dashboard/creditos/${creditoId}/cuotas`}>
          <Button variant="outline" size="sm">Volver al cronograma</Button>
        </Link>
      </div>
    );
  }


  // Estado VISIBLE — resuelve status + hasPendingDeclaration en un solo lugar.
  // `hasPendingDeclaration` viene del backend (es el mismo dato que congela la mora), así
  // que no depende de que el listado de declaraciones haya cargado bien.
  const view = getInstallmentViewStatus(cuota);
  const isUnderReview = view.status === 'UNDER_REVIEW';
  const totalInstallments = credit?.installmentCount ?? 0;
  // Solo se ofrece el formulario si la cuota admite pago ahora Y tiene saldo.
  const needsPayment = view.canDeclarePayment && cuota.outstanding > 0;
  // La superficie "Pagar" existe mientras haya algo que hacer o que contar sobre el pago.
  const showPaySurface = paymentStep !== 'declare' || isUnderReview || needsPayment;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* ─── Navegación ─── */}
      <Link
        href={`/dashboard/creditos/${creditoId}/cuotas`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Cronograma de cuotas
      </Link>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Cuota {cuota.installmentNo} de {totalInstallments}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {cuota.installmentCode ?? credit?.creditCode ?? `Crédito #${creditoId.slice(-6)}`}
          </p>
        </div>
        <Badge variant={view.variant}>{view.label}</Badge>
      </div>

      {/* ─── Dos superficies blancas sobre el fondo de la página ───
          Izquierda = resumen (cuánto y por qué). Derecha = la acción (depositar y subir el
          comprobante) y, debajo, el historial plegado. Sin cajas de colores ni tarjetas
          anidadas: dentro de cada superficie solo hay divisores finos. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Izquierda: Resumen ── */}
        <Surface aria-label="Resumen de la cuota">
          <SummaryContent view={view} cuota={cuota} pendingDeclaration={pendingDeclaration} />
        </Surface>

        {/* ── Derecha: Pagar + historial ── */}
        <div className="flex flex-col gap-4">
          {showPaySurface && (
            <Surface aria-label="Pagar la cuota">
              {/* STEP: submitting */}
              {paymentStep === 'submitting' && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  <p className="text-sm font-medium text-foreground">Enviando comprobantes...</p>
                  <p className="text-xs text-muted-foreground">No cierres esta página</p>
                </div>
              )}

              {/* STEP: error */}
              {paymentStep === 'error' && (
                <div className="space-y-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-error-700">
                      <XCircle className="w-4 h-4 shrink-0" />
                      No se pudo enviar la declaración
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {submitError ?? 'Ocurrió un error inesperado'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setPaymentStep('declare');
                        setSubmitError(null);
                      }}
                    >
                      Intentar de nuevo
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/creditos/${creditoId}`)}
                    >
                      Volver al crédito
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP: declare — comprobante en revisión (en lugar del formulario).
                  Se muestra según `isUnderReview` (que viene de hasPendingDeclaration del
                  backend, el mismo dato que congela la mora) y NO de la lista de
                  declaraciones: si esa llamada falla, igual se le informa al cliente que
                  tiene algo en revisión en vez de ofrecerle subir otro comprobante. */}
              {isUnderReview && paymentStep === 'declare' && (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Hourglass className="w-4 h-4 text-primary-600 shrink-0" />
                    Comprobante en revisión
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cuota.penaltyAccrued > 0
                      ? 'Estamos validando tu pago. La mora quedó detenida desde que lo enviaste — si todo está en orden, no vas a pagar nada extra por el tiempo de revisión.'
                      : 'Estamos validando tu pago. Te avisaremos apenas lo aprobemos.'}
                  </p>
                  {pendingDeclaration && (
                    <dl className="divide-y border-y">
                      {/* Monto y cantidad SOLO si hay más de un comprobante: con uno solo son el
                          mismo dato que ya se ve en el resumen; con varios aportan la SUMA. */}
                      {pendingDeclaration.vouchers.length > 1 && (
                        <>
                          <div className="flex items-center justify-between py-2.5">
                            <dt className="text-sm text-muted-foreground">Monto declarado (total)</dt>
                            <dd className="text-sm font-medium text-foreground">
                              {formatCurrency(pendingDeclaration.declaredAmount)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between py-2.5">
                            <dt className="text-sm text-muted-foreground">Comprobantes</dt>
                            <dd className="text-sm font-medium text-foreground">
                              {pendingDeclaration.vouchers.length}
                            </dd>
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between py-2.5">
                        <dt className="text-sm text-muted-foreground">Enviado el</dt>
                        <dd className="text-sm font-medium text-foreground">
                          {formatDate(pendingDeclaration.createdAt)}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              )}

              {/* STEP: declare — pasos "Deposita" y "Sube tu comprobante".
                  `needsPayment` ya excluye las cuotas en revisión, pagadas, refinanciadas y
                  futuras — ver getInstallmentViewStatus.canDeclarePayment. */}
              {needsPayment && paymentStep === 'declare' && (
                <div className="space-y-6">
                  {/* Paso 1 — datos para depositar, sin tarjeta propia. */}
                  <section className="space-y-3">
                    <StepHeading number={1} title="Deposita" />
                    <DepositAccountCard config={depositAccount} error={depositAccountError} bare />
                  </section>

                  {/* Paso 2 — el comprobante. */}
                  <section className="space-y-4 border-t border-border pt-6">
                    <StepHeading number={2} title="Sube tu comprobante" />

                    {mostRecentDeclaration?.status === 'REJECTED' && (
                      <p className="flex items-start gap-2 text-sm text-error-700">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Tu comprobante anterior fue rechazado:{' '}
                          {(
                            mostRecentDeclaration.clientMessage ??
                            'no cumplió con los requisitos'
                          ).replace(/[.\s]+$/, '')}
                          . Sube uno nuevo.
                        </span>
                      </p>
                    )}

                    <div className="space-y-5">
                      {voucherRows.map((row, idx) => (
                        <div key={row.key} className="space-y-3">
                          {voucherRows.length > 1 && (
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-foreground">Comprobante {idx + 1}</p>
                              <button
                                type="button"
                                onClick={() => removeVoucherRow(row.key)}
                                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-error-700 transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                          )}

                          {/* File input */}
                          <div className="space-y-1">
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              id={`voucher-file-${row.key}`}
                              className="hidden"
                              onChange={(e) => handleVoucherFileChange(row.key, e.target.files?.[0] ?? null)}
                            />
                            <label
                              htmlFor={`voucher-file-${row.key}`}
                              className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-neutral-300 px-3 py-3 text-sm hover:border-primary-600 transition-colors"
                            >
                              <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="truncate text-muted-foreground">
                                {row.file ? row.file.name : 'Seleccionar foto del comprobante (JPEG/PNG, máx. 10MB)'}
                              </span>
                            </label>
                            {row.fileError && (
                              <p className="text-xs text-error-700 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {row.fileError}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">N° de operación</label>
                              <Input
                                placeholder="Ej: OP-2026081500123"
                                value={row.operationNumber}
                                onChange={(e) => updateVoucherRow(row.key, { operationNumber: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Monto</label>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                value={row.amount}
                                onChange={(e) => updateVoucherRow(row.key, { amount: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addVoucherRow}
                      disabled={voucherRows.length >= MAX_VOUCHERS}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar otro comprobante
                    </button>

                    {/* Pie: resumen de una línea, botón y una sola nota. */}
                    <div className="space-y-3 border-t border-border pt-5">
                      <div className="space-y-0.5">
                        <p className="text-sm text-foreground">
                          Vas a declarar <span className="font-semibold tabular-nums">{formatCurrency(declaredTotal)}</span> de
                          los <span className="font-semibold tabular-nums">{formatCurrency(cuota.outstanding)}</span> que faltan
                        </p>
                        {declaredTotal > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {isExactDeclaredMatch ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                Cubre el total pendiente de esta cuota
                              </>
                            ) : declaredVsOutstandingDiff < 0 ? (
                              <>Quedaría un saldo de {formatCurrency(Math.abs(declaredVsOutstandingDiff))} sin declarar</>
                            ) : (
                              <>Supera el pendiente de esta cuota en {formatCurrency(declaredVsOutstandingDiff)}</>
                            )}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleSubmitDeclaration}
                        disabled={!canSubmitDeclaration}
                        className="w-full gap-2 h-11 font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:opacity-100"
                      >
                        <Send className="w-4 h-4" />
                        Enviar declaración
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Revisamos tu comprobante manualmente. La mora se detiene desde que lo envías.
                      </p>
                    </div>
                  </section>
                </div>
              )}
            </Surface>
          )}

          {/* Historial de comprobantes — plegado, independiente del status de la cuota y de
              `paymentStep`: siempre que haya al menos una declaración, se puede abrir. */}
          {installmentDeclarations.length > 0 && (
            <details className="group rounded-2xl border border-border bg-white px-5 py-3 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                Historial de comprobantes ({installmentDeclarations.length})
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-3 divide-y border-t">
                {loadingDeclarationDetails && Object.keys(declarationDetails).length === 0 && (
                  <li className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Cargando comprobantes...
                  </li>
                )}
                {installmentDeclarations.map((decl) => (
                  <li key={decl.id} className="space-y-2 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground">{formatDate(decl.createdAt)}</span>
                        <Badge variant={DECLARATION_STATUS_BADGE[decl.status].variant}>
                          {DECLARATION_STATUS_BADGE[decl.status].label}
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(decl.declaredAmount)}
                      </span>
                    </div>
                    {decl.status === 'REJECTED' && decl.clientMessage && (
                      <p className="text-xs text-error-700">{decl.clientMessage}</p>
                    )}
                    <VoucherList detail={declarationDetails[decl.id]} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Piezas de la página ───────────────────────────────────────────────────────

/** Superficie blanca sobre el fondo celeste de la página: el contraste que separa cada bloque. */
function Surface({ children, ...rest }: React.ComponentProps<'section'>) {
  return (
    <section {...rest} className="rounded-2xl border border-border bg-white p-5 md:p-6 shadow-sm">
      {children}
    </section>
  );
}

function StepHeading({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
      <span
        aria-hidden
        className="flex h-6 w-6 items-center justify-center rounded-full border border-primary-600 text-xs font-semibold text-primary-600"
      >
        {number}
      </span>
      {title}
    </h2>
  );
}

/**
 * Contenido del Resumen: el mensaje de estado es el título (sin caja de color) y, debajo, el
 * monto con su composición. El copy de las cuotas sin saldo sale de `getInstallmentViewStatus`.
 */
function SummaryContent({
  view,
  cuota,
  pendingDeclaration,
}: {
  view: InstallmentViewStatusInfo;
  cuota: Installment;
  pendingDeclaration: PaymentDeclaration | null;
}) {
  const balanceProps = {
    amountDue: cuota.amountDue,
    amountPaid: cuota.amountPaid,
    penaltyAccrued: cuota.penaltyAccrued,
    penaltyPaid: cuota.penaltyPaid,
    outstanding: cuota.outstanding,
    daysOverdue: cuota.daysOverdue,
    principalAmount: cuota.principalAmount,
    interestAmount: cuota.interestAmount,
    principalPaid: cuota.principalPaid,
    interestPaid: cuota.interestPaid,
  };

  switch (view.status) {
    case 'PAID': {
      const totalPaid = cuota.amountPaid + cuota.penaltyPaid;
      return (
        <div className="space-y-5">
          <div>
            <p className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              Cuota pagada
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pagaste {formatCurrency(totalPaid)}
              {cuota.paidAt ? ` el ${formatDate(cuota.paidAt)}` : ''}
            </p>
          </div>
          <InstallmentBalance {...balanceProps} variant="paid" />
        </div>
      );
    }

    case 'UNDER_REVIEW':
      return (
        <div>
          <p className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Hourglass className="w-6 h-6 text-primary-600 shrink-0" />
            Tu pago está en revisión
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {pendingDeclaration
              ? `Declaraste ${formatCurrency(pendingDeclaration.declaredAmount)} el ${formatDate(pendingDeclaration.createdAt)}. `
              : ''}
            {cuota.penaltyAccrued > 0 ? 'La mora está detenida mientras lo revisamos.' : 'Lo estamos revisando.'}
          </p>
        </div>
      );

    case 'NEGOTIATED':
      return (
        <div className="space-y-4">
          <div>
            <p className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <RefreshCw className="w-6 h-6 text-primary-600 shrink-0" />
              Cuota refinanciada
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Esta cuota se reorganizó en un crédito de refinanciamiento. Los pagos van a ese
              crédito, no a esta cuota.
            </p>
          </div>
          {cuota.negotiationCreditId && (
            <Link
              href={`/dashboard/creditos/${cuota.negotiationCreditId}`}
              className="inline-flex text-sm font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700"
            >
              Ir al crédito de refinanciamiento
            </Link>
          )}
        </div>
      );

    case 'OVERDUE':
      return (
        <InstallmentBalance
          {...balanceProps}
          note={
            <>
              <span className="text-error-700">
                Venció el {formatDate(cuota.dueDate)}
                {cuota.daysOverdue > 0 &&
                  ` · ${cuota.daysOverdue} ${cuota.daysOverdue === 1 ? 'día' : 'días'} de atraso`}
              </span>
              . Paga ahora para detener la mora.
            </>
          }
        />
      );

    case 'PARTIALLY_PAID':
      return (
        <InstallmentBalance
          {...balanceProps}
          note={`Ya pagaste ${formatCurrency(cuota.amountPaid)}. Vence el ${formatDate(cuota.dueDate)}.`}
        />
      );

    default:
      // CURRENT / PENDING
      return <InstallmentBalance {...balanceProps} note={`Vence el ${formatDate(cuota.dueDate)}`} />;
  }
}

// ─── Comprobantes de una declaración (historial) ───────────────────────────────

/** Miniatura del comprobante; si la imagen no carga (URL vencida, archivo borrado) no se muestra nada. */
function VoucherThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir foto en tamaño completo"
      className="block shrink-0 overflow-hidden rounded-md border border-border bg-white hover:border-primary-600 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- URL prefirmada temporal, no vale la pena el pipeline de optimización de next/image */}
      <img src={src} alt={alt} onError={() => setFailed(true)} className="h-14 w-14 object-cover" />
    </a>
  );
}

function VoucherList({ detail }: { detail: MyPaymentDeclarationDetail | undefined }) {
  if (!detail) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando comprobantes...
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {detail.vouchers.map((v, idx) => (
        <li key={v.id} className="flex items-center gap-3">
          <VoucherThumb src={v.photoUrl} alt={`Comprobante ${idx + 1} — operación ${v.operationNumber}`} />
          <div className="min-w-0 text-xs text-muted-foreground">
            <p>
              Operación <span className="font-mono text-foreground">{v.operationNumber}</span>
            </p>
            {detail.vouchers.length > 1 && <p>{formatCurrency(v.amount)}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
