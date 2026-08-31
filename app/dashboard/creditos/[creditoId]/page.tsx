'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Calendar as CalendarIcon,
  Info,
  FileText,
  ChevronRight,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  InstallmentCalendar,
  CalendarLegend,
  MonthSelector,
  NextPaymentAlert,
} from '@/components/credits';
import {
  getCreditByIdAction,
  getCreditSummaryAction,
  getInstallmentsAction,
  getNextPaymentAction,
} from '@/app/actions/credit.actions';
import type {
  Credit,
  CreditSummary,
  Installment,
  NextPayment,
  InstallmentViewStatus,
} from '@/modules/credits';
import {
  creditStatusLabels,
  creditStatusVariants,
  creditStatusDescriptions,
  getInstallmentViewStatus,
} from '@/modules/credits';
import { formatBackendDate, parseBackendDate } from '@/modules/shared/backend-date';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatCurrencyShort(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Ver `modules/shared/backend-date` — un LocalDate del backend parseado con `new Date()`
// muestra el día anterior en Perú.
const formatDate = formatBackendDate;

// El mapa de variantes vive en `modules/credits` (`creditStatusVariants`) — estaba
// duplicado acá y en `CreditsTable.tsx`, tipado con `string` en vez del enum.

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CreditDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="h-4 w-28 bg-neutral-200 rounded" />
      <div className="flex items-center gap-3">
        <div className="h-8 w-32 bg-neutral-200 rounded" />
        <div className="h-5 w-16 bg-neutral-200 rounded-full" />
      </div>
      <div className="h-3 w-48 bg-neutral-100 rounded" />
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="h-4 w-full bg-neutral-100 rounded" />
        <div className="h-2.5 w-full bg-neutral-100 rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-50 rounded-md border" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-neutral-50 rounded-lg border" />
        <div className="h-64 bg-neutral-50 rounded-lg border" />
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CreditoDetallePage() {
  const params = useParams();
  const creditoId = params.creditoId as string;

  const [credit, setCredit] = useState<Credit | null>(null);
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [nextPayment, setNextPayment] = useState<NextPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [visibleMonths, setVisibleMonths] = useState(1);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [creditRes, summaryRes, installmentsRes, nextPayRes] = await Promise.all([
        getCreditByIdAction(creditoId),
        getCreditSummaryAction(creditoId),
        getInstallmentsAction(creditoId),
        getNextPaymentAction(creditoId),
      ]);

      if (creditRes.ok) {
        setCredit(creditRes.data);
      } else {
        setError(creditRes.error.message);
      }

      if (summaryRes.ok) setSummary(summaryRes.data);
      if (installmentsRes.ok) {
        setInstallments(installmentsRes.data);
        // Auto-focus en la cuota que toca pagar
        const focus = installmentsRes.data.find(
          (i) => i.status === 'OVERDUE' || i.status === 'CURRENT' || i.status === 'PENDING',
        );
        if (focus) setCalendarMonth(parseBackendDate(focus.dueDate));
      }
      if (nextPayRes.ok) setNextPayment(nextPayRes.data);

      setLoading(false);
    }
    fetchAll();
  }, [creditoId]);

  if (loading) return <CreditDetailSkeleton />;

  if (error || !credit) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <CreditCard className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error ?? 'Crédito no encontrado'}</p>
        <Link href="/dashboard/creditos">
          <Button variant="outline" size="sm">Volver a Mis Créditos</Button>
        </Link>
      </div>
    );
  }

  const progressPercent = summary?.progressPercentage ?? 0;

  // El estado OVERDUE del backend es contable: se mantiene aunque el cliente ya haya
  // subido su comprobante y la mora esté congelada. Si TODAS las cuotas vencidas están
  // en revisión, pedirle "paga la más antigua para detener la mora" es incorrecto — ya
  // pagó, y la demora es de nuestra validación. Ver `installment-view-status.ts`.
  const overdueInstallments = installments.filter((i) => i.status === 'OVERDUE');
  const allOverdueUnderReview =
    overdueInstallments.length > 0 && overdueInstallments.every((i) => i.hasPendingDeclaration);

  // Caso mixto: algunas vencidas en revisión y otras no. Se aclara que solo faltan las
  // que no tienen comprobante, para que no crea que su declaración no llegó.
  const someOverdueUnderReview = overdueInstallments.some((i) => i.hasPendingDeclaration);

  const statusDescription = allOverdueUnderReview
    ? 'Recibimos tu comprobante y lo estamos validando. La mora está detenida mientras lo revisamos.'
    : credit.status === 'OVERDUE' && someOverdueUnderReview
      ? 'Ya recibimos un comprobante y lo estamos validando. Las demás cuotas vencidas siguen acumulando mora — declara su pago para detenerla.'
      : creditStatusDescriptions[credit.status];

  const handleSelectInstallment = (inst: Installment) => {
    if (selectedInstallment?.id === inst.id) {
      setSelectedInstallment(null);
      return;
    }
    setSelectedInstallment(inst);
    const instDate = parseBackendDate(inst.dueDate);
    const startMonth = calendarMonth.getMonth();
    const startYear = calendarMonth.getFullYear();
    let isVisible = false;
    for (let i = 0; i < visibleMonths; i++) {
      const m = (startMonth + i) % 12;
      const y = startYear + Math.floor((startMonth + i) / 12);
      if (instDate.getMonth() === m && instDate.getFullYear() === y) {
        isVisible = true;
        break;
      }
    }
    if (!isVisible) setCalendarMonth(instDate);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* ─── Navegación ─── */}
      <Link
        href="/dashboard/creditos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis Créditos
      </Link>

      {/* ─── Header ─── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            {formatCurrencyShort(credit.principal)}
          </h1>
          <Badge variant={creditStatusVariants[credit.status] ?? 'default'}>
            {creditStatusLabels[credit.status]}
          </Badge>
          {credit.creditType === 'NEGOTIATION' && (
            <Badge variant="warning">Refinanciamiento</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {credit.installmentCount} cuotas · Desembolsado el {formatDate(credit.disbursedAt)}
        </p>
        {/* "Suspendido" o "Castigado" no le dicen nada al cliente por sí solos — la
            descripción explica qué significa y qué hacer. */}
        {credit.status !== 'ACTIVE' && statusDescription && (
          <p className="text-sm text-muted-foreground mt-1">{statusDescription}</p>
        )}
      </div>

      {/* ─── Subsección: Negociación (solo si es NEGOTIATION) ─── */}
      {credit.creditType === 'NEGOTIATION' && (
        <Card className="border-primary-200 bg-primary-50/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-primary-900">
              <RefreshCw className="w-4 h-4 text-primary-600" />
              Crédito de refinanciamiento
            </CardTitle>
            <CardDescription className="text-primary-700">
              Este crédito se creó para cerrar una cuota que estaba en mora. No tuvo desembolso
              real — es la deuda de esa cuota reorganizada en un nuevo cronograma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {credit.originCreditId && (
                <Link href={`/dashboard/creditos/${credit.originCreditId}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    Ver crédito original
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
              {credit.rootCreditId && credit.rootCreditId !== credit.originCreditId && (
                <Link href={`/dashboard/creditos/${credit.rootCreditId}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    Ver crédito raíz
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Alerta próximo pago ───
          NextPayment no trae `hasPendingDeclaration`, así que se busca la cuota real en
          `installments` para saber si ya hay un comprobante en revisión. Sin esto se le
          decía "Cuota vencida — Pagar ahora" a alguien que ya había pagado. */}
      {nextPayment && (
        <Card>
          <CardContent>
            <NextPaymentAlert
              nextPayment={nextPayment}
              installment={installments.find((i) => i.installmentNo === nextPayment.installmentNo)}
              creditId={credit.id}
            />
          </CardContent>
        </Card>
      )}

      {/* ─── Progreso del préstamo ─── */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Progreso del préstamo</p>
            <p className="text-sm font-bold text-foreground">{Math.round(progressPercent)}% completado</p>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-accent-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="rounded-md border border-border bg-background p-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Total</p>
              <p className="text-base font-bold text-foreground">
                {formatCurrencyShort(credit.totalDue)}
              </p>
            </div>
            <div className="rounded-md border border-accent-200 bg-accent-50 p-2.5">
              <p className="text-xs text-accent-800 mb-0.5">Pagado</p>
              <p className="text-base font-bold text-accent-700">
                {formatCurrencyShort(credit.totalPaid)}
              </p>
            </div>
            <div className="rounded-md border border-error-200 bg-error-50 p-2.5">
              <p className="text-xs text-error-700 mb-0.5">Pendiente</p>
              <p className="text-base font-bold text-error-700">
                {formatCurrencyShort(credit.totalOutstanding)}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {credit.installmentsCompleted} de {credit.installmentCount} cuotas pagadas · Finaliza el {formatDate(credit.maturityDate)}
          </p>
        </CardContent>
      </Card>

      {/* El CTA prominente de pago que había acá era una repetición literal de la alerta
          de arriba (mismo monto, misma fecha, mismo destino). Se eliminó: dos llamados a
          la acción idénticos separados por el bloque de progreso no aportaban nada. */}

      {/* ─── Cuotas + Calendario ─── */}
      {installments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Cronograma de pagos
            </CardTitle>
            <CardDescription>
              {credit.installmentsCompleted} de {credit.installmentCount} pagadas — toca una cuota para ver en el calendario
            </CardDescription>
            <CardAction>
              <Link href={`/dashboard/creditos/${credit.id}/cuotas`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  Ver cronograma completo
                </Button>
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              {/* Lista de cuotas */}
              <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
                <InstallmentListMini
                  installments={installments}
                  selectedId={selectedInstallment?.id}
                  onSelect={handleSelectInstallment}
                />
              </div>

              {/* Calendario */}
              <div className="rounded-lg border border-border p-3 flex flex-col gap-2 h-full">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Calendario de pagos
                </p>
                <div className="flex-1 flex items-center justify-center overflow-x-auto">
                  <InstallmentCalendar
                    installments={installments}
                    selectedInstallment={selectedInstallment}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    onDayClick={handleSelectInstallment}
                    numberOfMonths={visibleMonths}
                  />
                </div>
                <div className="flex items-center justify-between w-full">
                  <CalendarLegend />
                  <MonthSelector value={visibleMonths} onChange={setVisibleMonths} options={[1, 2]} />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              href={`/dashboard/creditos/${credit.id}/cuotas`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Ver detalle completo de cuotas
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardFooter>
        </Card>
      )}

      {/* ─── Configuración de mora aplicada ─── */}
      {credit.penaltyConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning-500" />
              Sistema de mora aplicado
            </CardTitle>
            <CardDescription>
              Este crédito usa la configuración &quot;{credit.penaltyConfig.name}&quot;. La mora se calcula según los días de atraso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Días de atraso</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Tipo</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Valor</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Sobre</th>
                  </tr>
                </thead>
                <tbody>
                  {credit.penaltyConfig.ranges.map((range, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2 px-2 text-xs">
                        {range.toDay
                          ? `Del ${range.fromDay} al ${range.toDay}`
                          : `Desde el ${range.fromDay} en adelante`}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="text-[10px]">
                          {range.type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto fijo'}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right text-xs font-medium">
                        {range.type === 'PERCENTAGE'
                          ? `${range.value}%`
                          : `S/ ${range.value.toFixed(2)}`}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {range.type === 'PERCENTAGE'
                          ? range.base === 'PRINCIPAL' ? 'Monto total del préstamo' : 'Monto de la cuota'
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              La mora se aplica desde el primer día de atraso (sin período de gracia).
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Información del crédito ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Información del crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">ID del crédito</p>
              <p className="text-sm font-medium text-foreground font-mono">
                #{credit.id.slice(-8)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Fecha de desembolso</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(credit.disbursedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Fecha de vencimiento</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(credit.maturityDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Capital desembolsado</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(credit.principal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total de cuotas</p>
              <p className="text-sm font-medium text-foreground">
                {credit.installmentCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Cuotas pagadas</p>
              <p className="text-sm font-medium text-foreground">
                {credit.installmentsCompleted} de {credit.installmentCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Mini lista de cuotas (inline en la página de detalle) ────────────────────

/** Colores de cada fila de la mini-lista, indexados por estado VISIBLE. */
const MINI_ROW_STYLES: Record<InstallmentViewStatus, { row: string; dot: string }> = {
  PAID: { row: 'bg-accent-50/50 border-accent-200', dot: 'bg-accent-500' },
  UNDER_REVIEW: { row: 'bg-primary-50/50 border-primary-200', dot: 'bg-primary-400' },
  OVERDUE: { row: 'bg-error-50/50 border-error-200', dot: 'bg-error-500' },
  PARTIALLY_PAID: { row: 'bg-warning-50/50 border-warning-200', dot: 'bg-warning-400' },
  CURRENT: { row: 'bg-warning-50/50 border-warning-200', dot: 'bg-warning-400' },
  NEGOTIATED: { row: 'bg-primary-50/50 border-primary-200', dot: 'bg-primary-500' },
  PENDING: { row: 'border-border hover:bg-neutral-50', dot: 'bg-primary/20' },
};

function InstallmentListMini({
  installments,
  selectedId,
  onSelect,
}: {
  installments: Installment[];
  selectedId?: string | null;
  onSelect: (inst: Installment) => void;
}) {
  const maxHeight = 4 * 56;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Cuotas ({installments.length})
      </p>
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: `${maxHeight}px` }}>
        {installments.map((inst) => {
          const isSelected = selectedId === inst.id;
          // Estado visible: una cuota vencida con comprobante en revisión no se pinta de
          // rojo — el cliente ya pagó y la mora está detenida.
          const view = getInstallmentViewStatus(inst);
          const statusColor = MINI_ROW_STYLES[view.status];

          return (
            <div key={inst.id} className="flex items-stretch gap-1.5">
              <button
                onClick={() => onSelect(inst)}
                className={`flex-1 flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all hover:ring-1 hover:ring-primary/20 ${statusColor.row} ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${statusColor.dot}`}>
                  <span className="text-[9px] font-bold text-white">{inst.installmentNo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    Cuota {inst.installmentNo}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {view.status === 'NEGOTIATED' ? 'Refinanciada'
                      : view.status === 'UNDER_REVIEW' ? 'En revisión'
                      : formatDate(inst.dueDate)}
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground shrink-0">
                  {formatCurrencyShort(inst.amountDue)}
                </p>
              </button>
              {view.status === 'NEGOTIATED' && inst.negotiationCreditId && (
                <Link
                  href={`/dashboard/creditos/${inst.negotiationCreditId}`}
                  className="flex items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-2 text-primary-700 hover:bg-primary-100 transition-colors"
                  title="Ver crédito de refinanciamiento"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
