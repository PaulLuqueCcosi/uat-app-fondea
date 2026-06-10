'use client';

import { useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { es } from 'react-day-picker/locale';

/**
 * Detalle de un Crédito — con calendario interactivo de cuotas.
 * TODO: Conectar con API real.
 */

type InstallmentStatus = 'PAID' | 'PENDING' | 'UPCOMING';

interface Installment {
  number: number;
  amount: number;
  principal: number;
  interest: number;
  dueDate: string;
  paidDate: string | null;
  status: InstallmentStatus;
  receiptUrl: string | null;
}

const mockCredit = {
  id: 'cred-001',
  amount: 1500,
  disbursedDate: '2026-04-25',
  endDate: '2026-08-25',
  totalInstallments: 4,
  paidInstallments: 1,
  paidAmount: 375,
  pendingBalance: 1125,
  interestRate: 8.5,
  status: 'ACTIVE' as const,
  installments: [
    { number: 1, amount: 375, principal: 340, interest: 35, dueDate: '2026-05-25', paidDate: '2026-05-24', status: 'PAID' as InstallmentStatus, receiptUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { number: 2, amount: 375, principal: 345, interest: 30, dueDate: '2026-06-25', paidDate: null, status: 'PENDING' as InstallmentStatus, receiptUrl: null },
    { number: 3, amount: 375, principal: 350, interest: 25, dueDate: '2026-07-25', paidDate: null, status: 'UPCOMING' as InstallmentStatus, receiptUrl: null },
    { number: 4, amount: 375, principal: 355, interest: 20, dueDate: '2026-08-25', paidDate: null, status: 'UPCOMING' as InstallmentStatus, receiptUrl: null },
  ] satisfies Installment[],
};

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

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export default function CreditoDetallePage() {
  const params = useParams();
  const credit = mockCredit;
  const progress = Math.round((credit.paidAmount / credit.amount) * 100);
  const nextInstallment = credit.installments.find((i) => i.status === 'PENDING');

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    nextInstallment ? new Date(nextInstallment.dueDate) : new Date()
  );
  const [visibleMonths, setVisibleMonths] = useState(2);

  // Fechas para el calendario
  const paidDates = credit.installments
    .filter((i) => i.status === 'PAID')
    .map((i) => new Date(i.dueDate));

  const pendingDates = credit.installments
    .filter((i) => i.status === 'PENDING')
    .map((i) => new Date(i.dueDate));

  const upcomingDates = credit.installments
    .filter((i) => i.status === 'UPCOMING')
    .map((i) => new Date(i.dueDate));

  const allDueDates = credit.installments.map((i) => new Date(i.dueDate));

  // Handler para click en el calendario — solo reacciona a días con cuota
  const handleDayClick = (day: Date) => {
    const found = credit.installments.find((inst) =>
      isSameDay(new Date(inst.dueDate), day)
    );
    if (found) {
      selectInstallment(found);
    }
  };

  // Seleccionar cuota y mover el calendario solo si la fecha no es visible
  const selectInstallment = (inst: Installment) => {
    setSelectedInstallment(inst);
    const instDate = new Date(inst.dueDate);

    // Verificar si la fecha ya es visible en los meses mostrados
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

    if (!isVisible) {
      setCalendarMonth(instDate);
    }
  };

  // Fecha seleccionada para el modifier visual
  const selectedDate = selectedInstallment ? [new Date(selectedInstallment.dueDate)] : [];

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
            <Badge variant="success">Activo</Badge>
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
        {/* Calendario interactivo — ocupa más espacio */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Calendario de Pagos
            </CardTitle>
            <CardDescription>Haz clic en una fecha marcada para ver los detalles</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Calendar
              locale={es}
              onDayClick={handleDayClick}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              modifiers={{
                paid: paidDates,
                pending: pendingDates,
                upcoming: upcomingDates,
                active: selectedDate,
              }}
              modifiersClassNames={{
                paid: 'bg-success-500 text-white hover:bg-success-600 font-bold cursor-pointer',
                pending: 'bg-warning-400 text-warning-900 hover:bg-warning-500 font-bold cursor-pointer',
                upcoming: 'bg-primary-200 text-primary-900 hover:bg-primary-300 font-bold cursor-pointer',
                active: 'ring-2 ring-offset-2 ring-primary scale-110',
              }}
              numberOfMonths={visibleMonths}
              className="rounded-lg border border-border"
            />

            {/* Leyenda + selector de meses */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-success-500" />
                  <span className="text-[9px] text-muted-foreground">Pagada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-warning-400" />
                  <span className="text-[9px] text-muted-foreground">Próxima</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-200" />
                  <span className="text-[9px] text-muted-foreground">Futura</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setVisibleMonths(n)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                      visibleMonths === n
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={`${n} ${n === 1 ? 'mes' : 'meses'}`}
                  >
                    {n}M
                  </button>
                ))}
              </div>
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
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground">Total</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(selectedInstallment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Capital</p>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(selectedInstallment.principal)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Interés</p>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(selectedInstallment.interest)}</p>
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
                  {selectedInstallment.status === 'PAID' && selectedInstallment.receiptUrl && (
                    <a href={selectedInstallment.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <Download className="w-3.5 h-3.5" />
                        Comprobante
                      </Button>
                    </a>
                  )}
                  {(selectedInstallment.status === 'PENDING' || selectedInstallment.status === 'UPCOMING') && (
                    <Link href="/dashboard/pagar" className="flex-1">
                      <Button size="sm" className="w-full gap-1 bg-accent-500 text-accent-900 hover:bg-accent-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        Pagar
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
                  key={inst.number}
                  onClick={() => selectInstallment(inst)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all hover:ring-2 hover:ring-primary/20 ${
                    inst.status === 'PAID'
                      ? 'bg-success-50/50 border-success-200'
                      : inst.status === 'PENDING'
                      ? 'bg-warning-50/50 border-warning-200'
                      : 'border-border hover:bg-neutral-50'
                  } ${selectedInstallment?.number === inst.number ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    inst.status === 'PAID'
                      ? 'bg-success-500'
                      : inst.status === 'PENDING'
                      ? 'bg-warning-400'
                      : 'bg-primary/20'
                  }`}>
                    {inst.status === 'PAID' ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : inst.status === 'PENDING' ? (
                      <Clock className="w-4 h-4 text-warning-900" />
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
            <Link href="/dashboard/pagar" className="block">
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
