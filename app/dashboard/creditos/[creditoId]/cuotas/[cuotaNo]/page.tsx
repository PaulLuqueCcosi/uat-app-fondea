'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  CreditCard,
  Shield,
  XCircle,
  Loader2,
  Upload,
  ImageIcon,
  Plus,
  Trash2,
  Send,
  Hourglass,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  getInstallmentByNoAction,
  getCreditByIdAction,
} from '@/app/actions/credit.actions';
import {
  submitPaymentDeclarationAction,
  listMyPaymentDeclarationsAction,
} from '@/app/actions/payment-declaration.actions';
import type {
  Installment,
  Credit,
  InstallmentViewStatus,
  InstallmentViewStatusInfo,
} from '@/modules/credits';
import { getInstallmentViewStatus } from '@/modules/credits';
import { formatBackendDateLong } from '@/modules/shared/backend-date';
import type { PaymentDeclaration } from '@/modules/payment-declarations';
import { getActiveDepositAccountAction } from '@/app/actions/deposit-account.actions';
import type { DepositAccountConfig, DepositAccountError } from '@/modules/deposit-account';
import { DepositAccountCard } from '@/components/credits/DepositAccountCard';

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

type PaymentStep = 'declare' | 'submitting' | 'submitted' | 'error';

// ─── Banner de estado ─────────────────────────────────────────────────────────

/** Colores por estado visible — el copy sale de `view.description`. */
const BANNER_STYLES: Record<
  InstallmentViewStatus,
  { card: string; title: string; body: string; icon: React.ReactNode }
> = {
  PAID: {
    card: 'border-success-200 bg-success-50/50',
    title: 'text-success-900',
    body: 'text-success-700',
    icon: <CheckCircle className="w-4 h-4 text-success-700" />,
  },
  UNDER_REVIEW: {
    card: 'border-primary-200 bg-primary-50/50',
    title: 'text-primary-900',
    body: 'text-primary-700',
    icon: <Hourglass className="w-4 h-4 text-primary-600" />,
  },
  OVERDUE: {
    card: 'border-error-200 bg-error-50/50',
    title: 'text-error-900',
    body: 'text-error-700',
    icon: <AlertCircle className="w-4 h-4 text-error-600" />,
  },
  PARTIALLY_PAID: {
    card: 'border-warning-200 bg-warning-50/50',
    title: 'text-warning-900',
    body: 'text-warning-700',
    icon: <Clock className="w-4 h-4 text-warning-700" />,
  },
  CURRENT: {
    card: 'border-warning-200 bg-warning-50/50',
    title: 'text-warning-900',
    body: 'text-warning-700',
    icon: <Clock className="w-4 h-4 text-warning-700" />,
  },
  PENDING: {
    card: '',
    title: '',
    body: 'text-muted-foreground',
    icon: <Calendar className="w-4 h-4 text-muted-foreground" />,
  },
  NEGOTIATED: {
    card: 'border-primary-200 bg-primary-50/40',
    title: 'text-primary-900',
    body: 'text-primary-700',
    icon: <RefreshCw className="w-4 h-4 text-primary-600" />,
  },
};

function StatusBanner({
  view,
  cuota,
}: {
  view: InstallmentViewStatusInfo;
  cuota: Installment;
}) {
  const style = BANNER_STYLES[view.status];

  // Dato secundario relevante según el estado: cuándo se pagó, cuándo vence, cuánto falta.
  const meta = (() => {
    switch (view.status) {
      case 'PAID':
        return cuota.paidAt ? `Pagada el ${formatDate(cuota.paidAt)}` : null;
      case 'PARTIALLY_PAID':
        return `Ya pagaste ${formatCurrency(cuota.amountPaid)} · faltan ${formatCurrency(cuota.outstanding)}`;
      case 'OVERDUE':
        return `Venció el ${formatDate(cuota.dueDate)}`;
      case 'UNDER_REVIEW':
      case 'CURRENT':
      case 'PENDING':
        return `Vence el ${formatDate(cuota.dueDate)}`;
      default:
        return null;
    }
  })();

  return (
    <Card className={style.card}>
      <CardHeader>
        <CardTitle className={`text-sm flex items-center gap-2 ${style.title}`}>
          {style.icon}
          {view.label}
        </CardTitle>
        <CardDescription className={style.body}>
          {view.description}
          {meta && <span className="block mt-0.5 opacity-80">{meta}</span>}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Declaración de pago existente para esta cuota (la más reciente, si hay alguna)
  const [existingDeclaration, setExistingDeclaration] = useState<PaymentDeclaration | null>(null);

  // Cuenta a la que el cliente tiene que transferir. Se guarda también el error para
  // poder explicarle por qué no la ve (ej. el admin no configuró ninguna) en vez de
  // mostrarle el formulario sin decirle a dónde depositar.
  const [depositAccount, setDepositAccount] = useState<DepositAccountConfig | null>(null);
  const [depositAccountError, setDepositAccountError] = useState<DepositAccountError | null>(null);

  // Payment declaration state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('declare');
  const [submittedDeclaration, setSubmittedDeclaration] = useState<PaymentDeclaration | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nextVoucherKeyRef = useRef(1);
  const [voucherRows, setVoucherRows] = useState<VoucherRow[]>([
    { key: 0, file: null, fileError: null, operationNumber: '', amount: '' },
  ]);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const [cuotaRes, creditRes, declarationsRes, depositAccountRes] = await Promise.all([
        getInstallmentByNoAction(creditoId, cuotaNo),
        getCreditByIdAction(creditoId),
        listMyPaymentDeclarationsAction(0, 50),
        getActiveDepositAccountAction(),
      ]);
      if (cuotaRes.ok) {
        setCuota(cuotaRes.data);
      } else {
        setError(cuotaRes.error.message);
      }
      if (creditRes.ok) {
        setCredit(creditRes.data);
      }
      if (declarationsRes.ok) {
        // Más reciente primero según el backend — el primer match es el vigente.
        const match = declarationsRes.data.items.find(
          (d) => d.creditId === creditoId && d.installmentNo === cuotaNo,
        );
        setExistingDeclaration(match ?? null);
      }
      if (depositAccountRes.ok) {
        setDepositAccount(depositAccountRes.data);
      } else {
        setDepositAccountError(depositAccountRes.error);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [creditoId, cuotaNo]);

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
      setSubmittedDeclaration(result.data);
      setPaymentStep('submitted');
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
  const isOverdue = view.status === 'OVERDUE';
  const isUnderReview = view.status === 'UNDER_REVIEW';
  const totalInstallments = credit?.installmentCount ?? 0;
  // Solo se ofrece el formulario si la cuota admite pago ahora Y tiene saldo.
  const needsPayment = view.canDeclarePayment && cuota.outstanding > 0;

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

      {/* ─── Banner de estado ───
          Uno solo, derivado del estado visible. Antes había cinco bloques condicionales
          casi idénticos (uno por status) que había que mantener en paralelo — y ninguno
          contemplaba "comprobante en revisión", así que a un cliente que ya había pagado
          se le mostraba "Cuota vencida, paga lo antes posible". */}
      {paymentStep === 'declare' && (
        <StatusBanner view={view} cuota={cuota} />
      )}

      {/* ─── Layout 2 columnas ───
          Izquierda = info para leer (cuánto debo, dónde deposito). Derecha = la acción
          (el formulario). Antes DepositAccountCard estaba en la columna derecha, pegado
          al formulario — dejaba la izquierda (solo Desglose) mucho más corta que la
          derecha, con un hueco grande debajo. Moviéndola a la izquierda ambas columnas
          quedan con una altura parecida. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Columna izquierda: qué debo y dónde depositar ── */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Desglose
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">Monto de cuota</span>
                <span className="text-sm font-medium text-foreground">{formatCurrency(cuota.amountDue)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">Ya pagado</span>
                <span className="text-sm font-medium text-accent-700">{formatCurrency(cuota.amountPaid)}</span>
              </div>
              {cuota.penaltyAccrued > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-error-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Mora ({cuota.daysOverdue} días)
                  </span>
                  <span className="text-sm font-medium text-error-600">{formatCurrency(cuota.penaltyAccrued)}</span>
                </div>
              )}
              {cuota.penaltyPaid > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Mora pagada</span>
                  <span className="text-sm font-medium text-accent-700">{formatCurrency(cuota.penaltyPaid)}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-base font-semibold text-foreground">Pendiente</span>
                <span className="text-xl font-bold text-foreground">{formatCurrency(cuota.outstanding)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Advertencia si vencida */}
          {isOverdue && paymentStep === 'declare' && (
            <Card className="border-error-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-error-900">
                  <XCircle className="w-4 h-4 text-error-600" />
                  Consecuencias del atraso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-error-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Mora de {formatCurrency(cuota.penaltyAccrued)} acumulada por {cuota.daysOverdue} días de atraso</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Datos para depositar — solo si hay algo que pagar ahora. Va en la misma
              columna que el Desglose porque es info que el cliente lee antes de actuar,
              no parte del formulario en sí. */}
          {needsPayment && paymentStep === 'declare' && (
            <DepositAccountCard config={depositAccount} error={depositAccountError} />
          )}
        </div>

        {/* ── Columna derecha: declarar el pago ── */}
        <div className="flex flex-col gap-6">
          {/* STEP: declare — comprobante en revisión (en lugar del formulario).
              Se muestra según `isUnderReview` (que viene de hasPendingDeclaration del
              backend, el mismo dato que congela la mora) y NO de la lista de
              declaraciones: si esa llamada falla, igual se le informa al cliente que
              tiene algo en revisión en vez de ofrecerle subir otro comprobante. */}
          {isUnderReview && paymentStep === 'declare' && (
            <Card className="border-primary-200 bg-primary-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-primary-900">
                  <Hourglass className="w-4 h-4 text-primary-600" />
                  Comprobante en revisión
                </CardTitle>
                <CardDescription className="text-primary-700">
                  Estamos validando tu pago. La mora quedó detenida desde que lo enviaste —
                  si todo está en orden, no vas a pagar nada extra por el tiempo de revisión.
                </CardDescription>
              </CardHeader>
              {existingDeclaration && (
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-muted-foreground">Monto declarado</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(existingDeclaration.declaredAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-muted-foreground">Comprobantes</span>
                    <span className="text-sm font-medium text-foreground">
                      {existingDeclaration.vouchers.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-muted-foreground">Enviado el</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(existingDeclaration.createdAt)}
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* STEP: declare — formulario (con banner de rechazo previo si aplica).
              `needsPayment` ya excluye las cuotas en revisión, pagadas, refinanciadas y
              futuras — ver getInstallmentViewStatus.canDeclarePayment. */}
          {needsPayment && paymentStep === 'declare' && (
            <>
              {existingDeclaration?.status === 'REJECTED' && (
                <Card className="border-error-200 bg-error-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-error-900">
                      <XCircle className="w-4 h-4 text-error-600" />
                      Tu comprobante anterior fue rechazado
                    </CardTitle>
                    <CardDescription className="text-error-700">
                      {existingDeclaration.clientMessage ??
                        'No cumplió con los requisitos. Puedes enviar un nuevo comprobante.'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    Declarar pago con comprobante
                  </CardTitle>
                  <CardDescription>
                    ¿Ya transferiste? Sube la foto de tu comprobante. Un administrador validará
                    el pago manualmente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {voucherRows.map((row, idx) => (
                    <div key={row.key} className="rounded-lg border border-border p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs font-semibold text-foreground">Comprobante {idx + 1}</p>
                        </div>
                        {voucherRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVoucherRow(row.key)}
                            className="text-muted-foreground hover:text-error-600 transition-colors"
                            aria-label="Quitar comprobante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

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
                          className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-border px-3 py-2 text-sm hover:border-primary/40 transition-colors"
                        >
                          <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="truncate text-muted-foreground">
                            {row.file ? row.file.name : 'Seleccionar foto del comprobante (JPEG/PNG, máx. 10MB)'}
                          </span>
                        </label>
                        {row.fileError && (
                          <p className="text-xs text-error-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {row.fileError}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
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

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={addVoucherRow}
                    disabled={voucherRows.length >= MAX_VOUCHERS}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar otro comprobante
                  </Button>

                  <Separator />

                  <div
                    className={`rounded-lg border p-3 space-y-1.5 transition-colors ${
                      declaredTotal > 0 && isExactDeclaredMatch
                        ? 'border-success-200 bg-success-50/50'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total declarado</span>
                      <span className="font-semibold text-foreground">{formatCurrency(declaredTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pendiente de esta cuota</span>
                      <span className="font-medium text-foreground">{formatCurrency(cuota.outstanding)}</span>
                    </div>
                    {declaredTotal > 0 && (
                      <p
                        className={`text-xs flex items-center gap-1 pt-0.5 ${
                          isExactDeclaredMatch ? 'text-success-700' : 'text-muted-foreground'
                        }`}
                      >
                        {isExactDeclaredMatch ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
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
                    className={`w-full gap-2 h-11 font-semibold ${
                      isOverdue
                        ? 'bg-error-600 text-white hover:bg-error-700 disabled:bg-error-300'
                        : 'bg-accent-500 text-accent-900 hover:bg-accent-400 disabled:bg-accent-200'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    Enviar declaración
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground">
                    Tu comprobante quedará pendiente de revisión — el pago se aplicará recién cuando sea aprobado.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* STEP: submitting */}
          {paymentStep === 'submitting' && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">Enviando comprobantes...</p>
                  <p className="text-xs text-muted-foreground">No cierres esta página</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP: submitted */}
          {paymentStep === 'submitted' && submittedDeclaration && (
            <Card className="border-success-200 bg-success-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-success-900">
                  <CheckCircle className="w-5 h-5 text-success-700" />
                  Declaración enviada
                </CardTitle>
                <CardDescription className="text-success-700">
                  Pendiente de revisión — un administrador va a validar tu comprobante pronto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-success-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monto declarado</span>
                    <span className="text-sm font-bold text-success-700">
                      {formatCurrency(submittedDeclaration.declaredAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Comprobantes</span>
                    <span className="text-sm font-medium text-foreground">
                      {submittedDeclaration.vouchers.length}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    <Badge variant="pending">En revisión</Badge>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/creditos/${creditoId}`)}
                  >
                    Ver crédito
                  </Button>
                  <Button
                    className="flex-1 bg-accent-500 text-accent-900 hover:bg-accent-400"
                    onClick={() => router.push('/dashboard/creditos')}
                  >
                    Mis créditos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP: error */}
          {paymentStep === 'error' && (
            <Card className="border-error-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-error-900">
                  <XCircle className="w-4 h-4 text-error-600" />
                  No se pudo enviar la declaración
                </CardTitle>
                <CardDescription className="text-error-700">
                  {submitError ?? 'Ocurrió un error inesperado'}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Cuota refinanciada — la deuda se cobra en otro crédito, con link para ir. */}
          {view.status === 'NEGOTIATED' && paymentStep === 'declare' && (
            <Card className="border-primary-200 bg-primary-50/40">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-primary-900">
                  <RefreshCw className="w-4 h-4 text-primary-600" />
                  Cuota refinanciada
                </CardTitle>
                <CardDescription className="text-primary-700">
                  Esta cuota se reorganizó en un crédito de refinanciamiento. Los pagos van
                  a ese crédito, no a esta cuota.
                </CardDescription>
              </CardHeader>
              {cuota.negotiationCreditId && (
                <CardContent>
                  <Link href={`/dashboard/creditos/${cuota.negotiationCreditId}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      Ir al crédito de refinanciamiento
                    </Button>
                  </Link>
                </CardContent>
              )}
            </Card>
          )}

          {/* Cuota futura — no se puede adelantar el pago (lo rechaza el backend, ver
              TargetInstallmentSelector). Antes acá se le decía al cliente "puedes
              adelantar el pago si la cuota anterior está al día", que era incorrecto. */}
          {view.status === 'PENDING' && paymentStep === 'declare' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Todavía no vence
                </CardTitle>
                <CardDescription>
                  Vas a poder declarar el pago de esta cuota cuando llegue su turno. Si
                  querés adelantarte, primero se cobran las cuotas anteriores.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Cómo pagar — el cliente transfiere por su cuenta, no hay pasarela. */}
          {needsPayment && paymentStep === 'declare' && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
              <Shield className="w-4 h-4 text-success-600 shrink-0" />
              Tu comprobante se revisa manualmente. La mora se detiene desde que lo envías.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
