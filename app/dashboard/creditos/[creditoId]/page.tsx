'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Calendar as CalendarIcon,
  DollarSign,
  CheckCircle,
  Clock,
  FileText,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  InstallmentCalendar,
  CalendarLegend,
  MonthSelector,
} from '@/components/credits';
import { getCreditByIdAction } from '@/app/actions/credit.actions';
import type { Credit, Installment } from '@/modules/credits';
import { creditStatusLabels } from '@/modules/credits';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CreditDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="h-5 w-32 bg-neutral-200 rounded" />
      <div className="h-8 w-48 bg-neutral-200 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-neutral-100 rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-neutral-100 rounded-lg" />
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
  const [visibleMonths, setVisibleMonths] = useState(2);

  useEffect(() => {
    async function fetchCredit() {
      setLoading(true);
      const result = await getCreditByIdAction(creditoId);
      if (result.ok) {
        setCredit(result.data);
        const next = result.data.installments.find((i) => i.status === 'PENDING');
        if (next) setCalendarMonth(new Date(next.dueDate));
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
          <Button variant="outline" size="sm">Volver a Mis Créditos</Button>
        </Link>
      </div>
    );
  }

  const progress = Math.round((credit.paidAmount / credit.amount) * 100);
  const nextInstallment = credit.installments.find((i) => i.status === 'PENDING');

  const selectInstallment = (inst: Installment) => {
    if (selectedInstallment?.id === inst.id) {
      setSelectedInstallment(null);
      return;
    }
    setSelectedInstallment(inst);
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
      {/* Nav */}
      <Link
        href="/dashboard/creditos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis Créditos
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{formatCurrency(credit.amount)}</h1>
            <Badge variant="success">{creditStatusLabels[credit.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Crédito #{credit.id.slice(-6)} · Desembolsado {formatDate(credit.disbursedDate)}
          </p>
        </div>
        <Link href={`/dashboard/creditos/${credit.id}/cuotas`}>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Ver todas las cuotas
          </Button>
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Monto total</p>
            <p className="text-base font-bold text-foreground">{formatCurrency(credit.amount)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Pagado</p>
            <p className="text-base font-bold text-success-700">{formatCurrency(credit.paidAmount)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Pendiente</p>
            <p className="text-base font-bold text-foreground">{formatCurrency(credit.pendingBalance)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Tasa mensual</p>
            <p className="text-base font-bold text-foreground">{credit.interestRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Progreso */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Progreso de pago</p>
            <p className="text-sm font-bold text-primary">{progress}%</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {credit.paidInstallments} de {credit.totalInstallments} cuotas pagadas · Vence {formatDate(credit.endDate)}
          </p>
        </CardContent>
      </Card>

      {/* Calendario + Cronograma */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Calendario interactivo */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Calendario de Pagos
            </CardTitle>
            <CardDescription>Haz clic en una fecha marcada para ver los detalles</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <InstallmentCalendar
              installments={credit.installments}
              selectedInstallment={selectedInstallment}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onDayClick={selectInstallment}
              numberOfMonths={visibleMonths}
            />

            <div className="flex items-center justify-between w-full">
              <CalendarLegend />
              <MonthSelector value={visibleMonths} onChange={setVisibleMonths} options={[1, 2, 3, 4]} />
            </div>

            {/* Detalle de cuota seleccionada */}
            {selectedInstallment && (
              <div className="w-full rounded-lg border border-border bg-neutral-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedInstallment.status === 'PAID'
                        ? 'bg-success-100'
                        : selectedInstallment.status === 'PENDING'
                          ? 'bg-warning-100'
                          : selectedInstallment.status === 'OVERDUE'
                            ? 'bg-error-100'
                            : 'bg-neutral-100'
                    }`}>
                      {selectedInstallment.status === 'PAID' ? (
                        <CheckCircle className="w-4 h-4 text-success-700" />
                      ) : (
                        <Clock className="w-4 h-4 text-warning-700" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Cuota {selectedInstallment.number}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateLong(selectedInstallment.dueDate)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInstallment(null)}
                    className="p-1 rounded hover:bg-neutral-200"
                    aria-label="Cerrar detalle"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground">Total</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(selectedInstallment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Vencimiento</p>
                    <p className="text-sm font-medium text-foreground">{formatDateShort(selectedInstallment.dueDate)}</p>
                  </div>
                </div>

                {selectedInstallment.paidDate && (
                  <p className="text-xs text-success-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Pagada el {formatDateLong(selectedInstallment.paidDate)}
                  </p>
                )}

                {/* Acciones */}
                <div className="flex gap-2">
                  {(selectedInstallment.status === 'PENDING' || selectedInstallment.status === 'UPCOMING' || selectedInstallment.status === 'OVERDUE') && (
                    <Link href={`/dashboard/creditos/${credit.id}/cuotas/${selectedInstallment.id}`} className="flex-1">
                      <Button
                        size="sm"
                        className={`w-full gap-1 ${
                          selectedInstallment.status === 'OVERDUE'
                            ? 'bg-error-600 text-white hover:bg-error-700'
                            : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        {selectedInstallment.status === 'OVERDUE' ? 'Pagar (vencida)' : 'Pagar'}
                      </Button>
                    </Link>
                  )}
                  <Link href={`/dashboard/creditos/${credit.id}/cuotas`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      Ver detalle
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cronograma en lista */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Cronograma
            </CardTitle>
            <CardDescription>{credit.paidInstallments} de {credit.totalInstallments} pagadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {credit.installments.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => selectInstallment(inst)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all hover:ring-2 hover:ring-primary/20 ${
                    inst.status === 'PAID'
                      ? 'bg-success-50/50 border-success-200'
                      : inst.status === 'PENDING'
                        ? 'bg-warning-50/50 border-warning-200'
                        : inst.status === 'OVERDUE'
                          ? 'bg-error-50/50 border-error-200'
                          : 'border-border hover:bg-neutral-50'
                  } ${selectedInstallment?.id === inst.id ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    inst.status === 'PAID'
                      ? 'bg-success-500'
                      : inst.status === 'PENDING'
                        ? 'bg-warning-400'
                        : inst.status === 'OVERDUE'
                          ? 'bg-error-500'
                          : 'bg-primary/20'
                  }`}>
                    {inst.status === 'PAID' ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : inst.status === 'PENDING' ? (
                      <Clock className="w-4 h-4 text-warning-900" />
                    ) : inst.status === 'OVERDUE' ? (
                      <Clock className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-[10px] font-bold text-primary-700">{inst.number}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">Cuota {inst.number}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDateShort(inst.dueDate)}
                      {inst.paidDate && <span className="text-success-700"> · Pagada</span>}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-foreground shrink-0">{formatCurrency(inst.amount)}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>

            <Link href={`/dashboard/creditos/${credit.id}/cuotas`} className="block mt-4">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Ver detalle completo
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Próxima cuota + Pagar */}
      {nextInstallment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Próxima cuota</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(nextInstallment.amount)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Vence {formatDate(nextInstallment.dueDate)} · Cuota {nextInstallment.number}/{credit.totalInstallments}
                </p>
              </div>
            </div>
            <Link href={`/dashboard/creditos/${credit.id}/cuotas/${nextInstallment.id}`} className="block">
              <Button className="w-full gap-2 bg-accent-500 text-accent-900 hover:bg-accent-400">
                <DollarSign className="w-4 h-4" />
                Pagar cuota
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
