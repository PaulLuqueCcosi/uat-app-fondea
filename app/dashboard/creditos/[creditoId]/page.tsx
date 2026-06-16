'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  AlertCircle,
  DollarSign,
  Calendar as CalendarIcon,
  Info,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  InstallmentList,
  InstallmentCalendar,
  CalendarLegend,
  MonthSelector,
} from '@/components/credits';
import { getCreditByIdAction } from '@/app/actions/credit.actions';
import type { Credit, Installment } from '@/modules/credits';
import { creditStatusLabels } from '@/modules/credits';

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
  });
}

// ─── Status badge variant ─────────────────────────────────────────────────────

const statusVariants: Record<string, 'success' | 'completed' | 'error' | 'default'> = {
  ACTIVE: 'success',
  COMPLETED: 'completed',
  OVERDUE: 'error',
  DEFAULTED: 'error',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CreditDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      {/* Back */}
      <div className="h-4 w-28 bg-neutral-200 rounded" />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-32 bg-neutral-200 rounded" />
        <div className="h-5 w-16 bg-neutral-200 rounded-full" />
      </div>
      <div className="h-3 w-48 bg-neutral-100 rounded" />
      {/* Progress section */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="h-4 w-full bg-neutral-100 rounded" />
        <div className="h-2.5 w-full bg-neutral-100 rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-50 rounded-md border" />
          ))}
        </div>
      </div>
      {/* Cuotas */}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [visibleMonths, setVisibleMonths] = useState(1);

  useEffect(() => {
    async function fetchCredit() {
      setLoading(true);
      const result = await getCreditByIdAction(creditoId);
      if (result.ok) {
        setCredit(result.data);
        // Auto-focus en la próxima cuota pendiente o vencida
        const focus = result.data.installments.find(
          (i) => i.status === 'OVERDUE' || i.status === 'PENDING',
        );
        if (focus) setCalendarMonth(new Date(focus.dueDate));
      } else {
        setError(result.error.message);
      }
      setLoading(false);
    }
    fetchCredit();
  }, [creditoId]);

  if (loading) return <CreditDetailSkeleton />;

  if (error || !credit) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <CreditCard className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error ?? 'Crédito no encontrado'}</p>
        <Link href="/dashboard/creditos">
          <Button variant="outline" size="sm">
            Volver a Mis Créditos
          </Button>
        </Link>
      </div>
    );
  }

  const progressPercent = Math.round((credit.paidAmount / credit.amount) * 100);
  const overdueInstallment = credit.installments.find((i) => i.status === 'OVERDUE');
  const nextInstallment = credit.installments.find((i) => i.status === 'PENDING');

  const handleSelectInstallment = (inst: Installment) => {
    if (selectedInstallment?.id === inst.id) {
      setSelectedInstallment(null);
      return;
    }
    setSelectedInstallment(inst);
    // Mover calendario si la cuota no está visible
    const instDate = new Date(inst.dueDate);
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
            {formatCurrencyShort(credit.amount)}
          </h1>
          <Badge variant={statusVariants[credit.status] ?? 'default'}>
            {creditStatusLabels[credit.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {credit.totalInstallments} cuotas · Desembolsado el {formatDate(credit.disbursedDate)}
        </p>
      </div>

      {/* ─── Alerta cuota vencida ─── */}
      {overdueInstallment && (
        <Card className="border-error-200 bg-error-50">
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-error-900">
                  Cuota {overdueInstallment.number} vencida
                </p>
                <p className="text-xs text-error-700">
                  Venció el {formatDateLong(overdueInstallment.dueDate)} · {formatCurrency(overdueInstallment.amount)} sin pagar
                </p>
              </div>
              <Link href={`/dashboard/creditos/${credit.id}/cuotas/${overdueInstallment.id}`}>
                <Button size="sm" className="bg-error-600 text-white hover:bg-error-700 text-xs shrink-0">
                  Pagar ahora
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Progreso del préstamo ─── */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Progreso del préstamo</p>
            <p className="text-sm font-bold text-foreground">{progressPercent}% completado</p>
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
                {formatCurrencyShort(credit.amount)}
              </p>
            </div>
            <div className="rounded-md border border-accent-200 bg-accent-50 p-2.5">
              <p className="text-xs text-accent-800 mb-0.5">Pagado</p>
              <p className="text-base font-bold text-accent-700">
                {formatCurrencyShort(credit.paidAmount)}
              </p>
            </div>
            <div className="rounded-md border border-error-200 bg-error-50 p-2.5">
              <p className="text-xs text-error-700 mb-0.5">Pendiente</p>
              <p className="text-base font-bold text-error-700">
                {formatCurrencyShort(credit.pendingBalance)}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {credit.paidInstallments} de {credit.totalInstallments} cuotas pagadas · Finaliza el {formatDate(credit.endDate)}
          </p>
        </CardContent>
      </Card>

      {/* ─── Próxima cuota (CTA prominente) ─── */}
      {nextInstallment && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Próxima cuota</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(nextInstallment.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vence el {formatDateLong(nextInstallment.dueDate)} · Cuota {nextInstallment.number}/{credit.totalInstallments}
                </p>
              </div>
              <Link href={`/dashboard/creditos/${credit.id}/cuotas/${nextInstallment.id}`}>
                <Button className="gap-2 bg-accent-500 text-accent-900 hover:bg-accent-400">
                  <DollarSign className="w-4 h-4" />
                  Pagar cuota
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Cuotas + Calendario (mismo estilo que dashboard) ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Cronograma de pagos
          </CardTitle>
          <CardDescription>
            {credit.paidInstallments} de {credit.totalInstallments} pagadas — toca una cuota para ver en el calendario
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
              <InstallmentList
                installments={credit.installments}
                selectedId={selectedInstallment?.id}
                onSelect={handleSelectInstallment}
                creditId={credit.id}
                maxVisible={8}
              />
            </div>

            {/* Calendario */}
            <div className="rounded-lg border border-border p-3 flex flex-col gap-2 h-full">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Calendario de pagos
              </p>
              <div className="flex-1 flex items-center justify-center overflow-x-auto">
                <InstallmentCalendar
                  installments={credit.installments}
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
                {formatDate(credit.disbursedDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Fecha de vencimiento</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(credit.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Tasa mensual</p>
              <p className="text-sm font-medium text-foreground">
                {credit.interestRate}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total de cuotas</p>
              <p className="text-sm font-medium text-foreground">
                {credit.totalInstallments}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Cuotas pagadas</p>
              <p className="text-sm font-medium text-foreground">
                {credit.paidInstallments} de {credit.totalInstallments}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
