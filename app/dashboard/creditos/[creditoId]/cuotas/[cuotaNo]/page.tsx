'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
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
  getMyPaymentDeclarationByIdAction,
} from '@/app/actions/payment-declaration.actions';
import type {
  Installment,
  Credit,
  InstallmentViewStatus,
  InstallmentViewStatusInfo,
} from '@/modules/credits';
import { getInstallmentViewStatus } from '@/modules/credits';
import { formatBackendDateLong } from '@/modules/shared/backend-date';
import type { PaymentDeclaration, MyPaymentDeclarationDetail } from '@/modules/payment-declarations';
import { getActiveDepositAccountAction } from '@/app/actions/deposit-account.actions';
import type { DepositAccountConfig, DepositAccountError } from '@/modules/deposit-account';
import { DepositAccountCard } from '@/components/credits/DepositAccountCard';
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

  // Historial de comprobantes: la tarjeta siempre muestra poco por defecto (la última
  // declaración si la cuota sigue activa, o solo las aprobadas si ya cerró). El botón "Ver
  // todo el historial" abre un modal aparte con TODAS las declaraciones, cada una colapsada
  // (se expande individualmente para ver sus fotos) — en vez de desparramar todo inline en
  // la misma tarjeta, que se volvía ilegible con varios comprobantes por declaración.
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

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
    setHistoryDialogOpen(false);
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
            <>
              {/* Fondo blanco liso, igual que el resto de tarjetas de la página — antes tenía
                  bg-primary-50/50 (celeste), que el usuario pidió explícitamente sacar. El
                  color queda solo en el ícono/título, como acento, no como fondo. */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-primary-900">
                    <Hourglass className="w-4 h-4 text-primary-600" />
                    Comprobante en revisión
                  </CardTitle>
                  <CardDescription>
                    Estamos validando tu pago. La mora quedó detenida desde que lo enviaste —
                    si todo está en orden, no vas a pagar nada extra por el tiempo de revisión.
                  </CardDescription>
                </CardHeader>
                {pendingDeclaration && (
                  <CardContent className="space-y-2">
                    {/* Monto y cantidad de comprobantes SOLO si hay más de uno — con un solo
                        comprobante son el mismo dato que ya se ve en el historial de abajo,
                        mostrarlos acá también era pura repetición. Con varios comprobantes
                        sí aportan: son la SUMA y el conteo, no un dato de un voucher puntual. */}
                    {pendingDeclaration.vouchers.length > 1 && (
                      <>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-muted-foreground">Monto declarado (total)</span>
                          <span className="text-sm font-medium text-foreground">
                            {formatCurrency(pendingDeclaration.declaredAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-muted-foreground">Comprobantes</span>
                          <span className="text-sm font-medium text-foreground">
                            {pendingDeclaration.vouchers.length}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-muted-foreground">Enviado el</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(pendingDeclaration.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            </>
          )}

          {/* STEP: declare — formulario (con banner de rechazo previo si aplica).
              `needsPayment` ya excluye las cuotas en revisión, pagadas, refinanciadas y
              futuras — ver getInstallmentViewStatus.canDeclarePayment. */}
          {needsPayment && paymentStep === 'declare' && (
            <>
              {mostRecentDeclaration?.status === 'REJECTED' && (
                <Card className="border-error-200 bg-error-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-error-900">
                      <XCircle className="w-4 h-4 text-error-600" />
                      Tu comprobante anterior fue rechazado
                    </CardTitle>
                    <CardDescription className="text-error-700">
                      {mostRecentDeclaration.clientMessage ??
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

          {/* Historial de comprobantes — sección propia, independiente del status de la
              cuota y de `paymentStep`: siempre que haya al menos una declaración, se ve.
              La tarjeta inline muestra POCO (para no enterrar al cliente en intentos
              viejos): solo lo aprobado si la cuota ya cerró, o solo la última declaración
              si sigue activa. "Ver todo el historial" abre un modal aparte con TODAS,
              cada una colapsada — se expande una por una para ver sus fotos, en vez de
              desparramar todo inline (ilegible con varios comprobantes por declaración). */}
          {(() => {
            const isClosedInstallment = view.status === 'PAID';
            const defaultDeclarations = isClosedInstallment
              ? installmentDeclarations.filter((d) => d.status === 'APPROVED')
              : mostRecentDeclaration ? [mostRecentDeclaration] : [];
            const hasMoreToShow = installmentDeclarations.length > defaultDeclarations.length;
            if (installmentDeclarations.length === 0) return null;
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    Historial de comprobantes
                  </CardTitle>
                  <CardDescription>
                    {isClosedInstallment
                      ? 'Comprobantes aprobados para esta cuota.'
                      : 'Tu declaración más reciente para esta cuota.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingDeclarationDetails && Object.keys(declarationDetails).length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Cargando comprobantes...
                    </div>
                  )}
                  {defaultDeclarations.map((decl) => (
                    <div key={decl.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDate(decl.createdAt)}</span>
                        <Badge variant={DECLARATION_STATUS_BADGE[decl.status].variant}>
                          {DECLARATION_STATUS_BADGE[decl.status].label}
                        </Badge>
                      </div>
                      {decl.status === 'REJECTED' && decl.clientMessage && (
                        <p className="text-xs text-error-700 bg-error-50/50 border border-error-200 rounded-md px-2.5 py-1.5">
                          {decl.clientMessage}
                        </p>
                      )}
                      <VoucherPhotos detail={declarationDetails[decl.id]} />
                    </div>
                  ))}

                  {hasMoreToShow && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setHistoryDialogOpen(true)}
                    >
                      Ver todo el historial ({installmentDeclarations.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* Modal con TODAS las declaraciones de esta cuota, cada una colapsada por defecto —
          se expande individualmente para ver sus fotos. Separado de la tarjeta inline para
          no desparramar potencialmente muchas fotos de golpe en medio de la página. */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        {/* Ancho: se deja la base mobile-safe del componente (`max-w-[calc(100%-2rem)]`, con
            margen a los costados en pantallas chicas) y solo se ensancha desde `sm:` en
            adelante — un `max-w-lg` a secas pisaría ese cap en mobile y el modal tocaría
            los bordes de la pantalla sin margen. */}
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b shrink-0">
            <DialogTitle className="text-base">Historial completo de comprobantes</DialogTitle>
            <DialogDescription>
              Cuota {cuota.installmentNo} — todas tus declaraciones, más reciente primero.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {installmentDeclarations.map((decl, i) => (
              <Collapsible key={decl.id} defaultOpen={i === 0} className="rounded-lg border border-border overflow-hidden">
                <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(decl.createdAt)}</span>
                    <Badge variant={DECLARATION_STATUS_BADGE[decl.status].variant}>
                      {DECLARATION_STATUS_BADGE[decl.status].label}
                    </Badge>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-data-[panel-open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3 space-y-3 border-t border-border">
                  <div className="pt-3 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Monto declarado: <span className="font-medium text-foreground">{formatCurrency(decl.declaredAmount)}</span>
                    </p>
                    {decl.status === 'REJECTED' && decl.clientMessage && (
                      <p className="text-xs text-error-700 bg-error-50/50 border border-error-200 rounded-md px-2.5 py-1.5">
                        {decl.clientMessage}
                      </p>
                    )}
                  </div>
                  <VoucherPhotos detail={declarationDetails[decl.id]} />
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Fotos de los comprobantes de una declaración ──────────────────────────────
// Extraído porque se usa tanto en la tarjeta inline (resumen) como en el modal del
// historial completo — antes estaba duplicado entre ambos lugares.

function VoucherPhotos({ detail }: { detail: MyPaymentDeclarationDetail | undefined }) {
  if (!detail) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando comprobantes...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {detail.vouchers.map((v, idx) => (
        <div key={v.id} className="rounded-lg border border-border bg-card p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
              {idx + 1}
            </span>
            <p className="text-xs font-semibold text-foreground">Comprobante {idx + 1}</p>
          </div>

          <a
            href={v.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border border-border overflow-hidden bg-white hover:border-primary/40 transition-colors"
            title="Abrir foto en tamaño completo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- URL prefirmada temporal, no vale la pena el pipeline de optimización de next/image */}
            <img
              src={v.photoUrl}
              alt={`Comprobante ${idx + 1} — operación ${v.operationNumber}`}
              className="w-full max-h-80 object-contain mx-auto bg-white group-hover:opacity-90 transition-opacity"
            />
          </a>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">N° de operación</p>
              <p className="text-sm font-mono text-foreground truncate">{v.operationNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Monto</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(v.amount)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
