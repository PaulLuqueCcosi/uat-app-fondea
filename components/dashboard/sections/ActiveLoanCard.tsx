'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Calendar as CalendarIcon,
  CreditCard,
  CheckCircle,
  Clock,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'react-day-picker/locale';

type InstallmentStatus = 'PAID' | 'PENDING' | 'UPCOMING';

interface Installment {
  id: string;
  number: number;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: InstallmentStatus;
}

const mockLoan = {
  id: 'cred-001',
  totalAmount: 1500,
  pendingBalance: 1125,
  paidAmount: 375,
  totalInstallments: 4,
  paidInstallments: 1,
  status: 'ACTIVE' as const,
  installments: [
    { id: 'inst-001', number: 1, amount: 375, dueDate: '2026-05-25', paidDate: '2026-05-24', status: 'PAID' as InstallmentStatus },
    { id: 'inst-002', number: 2, amount: 375, dueDate: '2026-06-25', paidDate: null, status: 'PENDING' as InstallmentStatus },
    { id: 'inst-003', number: 3, amount: 375, dueDate: '2026-07-25', paidDate: null, status: 'UPCOMING' as InstallmentStatus },
    { id: 'inst-004', number: 4, amount: 375, dueDate: '2026-08-25', paidDate: null, status: 'UPCOMING' as InstallmentStatus },
  ] satisfies Installment[],
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(amount);
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function ActiveLoanCard() {
  const loan = mockLoan;
  const progressPercent = Math.round((loan.paidAmount / loan.totalAmount) * 100);
  const nextInstallment = loan.installments.find((i) => i.status === 'PENDING');

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    nextInstallment ? new Date(nextInstallment.dueDate) : new Date()
  );
  const [visibleMonths, setVisibleMonths] = useState(2);

  const paidDates = loan.installments.filter((i) => i.status === 'PAID').map((i) => new Date(i.dueDate));
  const pendingDates = loan.installments.filter((i) => i.status === 'PENDING').map((i) => new Date(i.dueDate));
  const upcomingDates = loan.installments.filter((i) => i.status === 'UPCOMING').map((i) => new Date(i.dueDate));
  const selectedDate = selectedInstallment ? [new Date(selectedInstallment.dueDate)] : [];

  const handleDayClick = (day: Date) => {
    const found = loan.installments.find((inst) => isSameDay(new Date(inst.dueDate), day));
    if (found) selectInstallment(found);
  };

  const selectInstallment = (inst: Installment) => {
    setSelectedInstallment(inst);
    const instDate = new Date(inst.dueDate);
    const startMonth = calendarMonth.getMonth();
    const startYear = calendarMonth.getFullYear();
    let isVisible = false;
    for (let i = 0; i < visibleMonths; i++) {
      const m = (startMonth + i) % 12;
      const y = startYear + Math.floor((startMonth + i) / 12);
      if (instDate.getMonth() === m && instDate.getFullYear() === y) { isVisible = true; break; }
    }
    if (!isVisible) setCalendarMonth(instDate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Tu Préstamo Actual
          </span>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="success" className="text-[10px]">Activo</Badge>
          <span>{formatCurrency(loan.totalAmount)} · {loan.totalInstallments} cuotas</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumen + Barra */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-base font-bold text-success-700">{formatCurrency(loan.paidAmount)}</p>
            <p className="text-[9px] text-muted-foreground">Pagado</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-foreground">{formatCurrency(loan.pendingBalance)}</p>
            <p className="text-[9px] text-muted-foreground">Pendiente</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-primary">{progressPercent}%</p>
            <p className="text-[9px] text-muted-foreground">Avance</p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${progressPercent}%` }} />
        </div>

        <Separator />

        {/* 2 columnas: Calendario | Lista de cuotas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calendario — ancho mínimo para que no se comprima */}
          <div className="flex flex-col items-center gap-2 min-w-[280px]">
            <Calendar
              locale={es}
              onDayClick={handleDayClick}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              modifiers={{ paid: paidDates, pending: pendingDates, upcoming: upcomingDates, active: selectedDate }}
              modifiersClassNames={{
                paid: 'bg-success-500 text-white hover:bg-success-600 font-bold cursor-pointer',
                pending: 'bg-warning-400 text-warning-900 hover:bg-warning-500 font-bold cursor-pointer',
                upcoming: 'bg-primary-200 text-primary-900 hover:bg-primary-300 font-bold cursor-pointer',
                active: 'ring-2 ring-offset-2 ring-primary scale-110',
              }}
              numberOfMonths={visibleMonths}
              className="rounded-lg border border-border"
            />
            {/* Leyenda + meses */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success-500" />
                  <span className="text-[8px] text-muted-foreground">Pagada</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-warning-400" />
                  <span className="text-[8px] text-muted-foreground">Próxima</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary-200" />
                  <span className="text-[8px] text-muted-foreground">Futura</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setVisibleMonths(n)}
                    className={`px-1 py-0.5 rounded text-[8px] font-medium transition-colors ${
                      visibleMonths === n ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {n}M
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de cuotas (max 4 visibles, scroll si hay más) */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cuotas</p>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
              {loan.installments.map((inst) => (
                <button
                  key={inst.number}
                  onClick={() => selectInstallment(inst)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 border text-left transition-all hover:ring-1 hover:ring-primary/20 ${
                    inst.status === 'PAID' ? 'bg-success-50/50 border-success-200' :
                    inst.status === 'PENDING' ? 'bg-warning-50/50 border-warning-200' :
                    'border-border hover:bg-neutral-50'
                  } ${selectedInstallment?.id === inst.id ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    inst.status === 'PAID' ? 'bg-success-500' :
                    inst.status === 'PENDING' ? 'bg-warning-400' : 'bg-primary/20'
                  }`}>
                    {inst.status === 'PAID' ? (
                      <CheckCircle className="w-3 h-3 text-white" />
                    ) : inst.status === 'PENDING' ? (
                      <Clock className="w-3 h-3 text-warning-900" />
                    ) : (
                      <span className="text-[8px] font-bold text-primary-700">{inst.number}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground">Cuota {inst.number}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {formatDateShort(inst.dueDate)}
                      {inst.paidDate && <span className="text-success-700"> · Pagada</span>}
                    </p>
                  </div>
                  <p className="text-[11px] font-bold text-foreground shrink-0">{formatCurrency(inst.amount)}</p>
                </button>
              ))}
            </div>

            {/* Detalle de cuota seleccionada */}
            {selectedInstallment && (
              <div className="rounded-lg border border-border bg-neutral-50 p-2.5 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-foreground">
                    Cuota {selectedInstallment.number} · {formatCurrency(selectedInstallment.amount)}
                  </p>
                  <button onClick={() => setSelectedInstallment(null)} className="p-0.5 rounded hover:bg-neutral-200">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  {formatDateLong(selectedInstallment.dueDate)}
                  {selectedInstallment.paidDate && (
                    <span className="text-success-700"> · Pagada {formatDateShort(selectedInstallment.paidDate)}</span>
                  )}
                </p>
                <div className="flex gap-1.5">
                  {(selectedInstallment.status === 'PENDING' || selectedInstallment.status === 'UPCOMING') && (
                    <Link href={`/dashboard/creditos/${loan.id}/cuotas/${selectedInstallment.id}`} className="flex-1">
                      <Button size="xs" className="w-full gap-1 bg-accent-500 text-accent-900 hover:bg-accent-400">
                        <DollarSign className="w-3 h-3" />
                        Pagar
                      </Button>
                    </Link>
                  )}
                  <Link href={`/dashboard/creditos/${loan.id}`} className="flex-1">
                    <Button variant="outline" size="xs" className="w-full gap-1">
                      Ver crédito
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Si no hay selección: próxima cuota */}
            {!selectedInstallment && nextInstallment && (
              <div className="flex gap-1.5 pt-1">
                <Link href={`/dashboard/creditos/${loan.id}/cuotas/${nextInstallment.id}`} className="flex-1">
                  <Button size="sm" className="w-full gap-1 bg-accent-500 text-accent-900 hover:bg-accent-400 text-[11px]">
                    <DollarSign className="w-3.5 h-3.5" />
                    Pagar cuota
                  </Button>
                </Link>
                <Link href={`/dashboard/creditos/${loan.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1 text-[11px]">
                    <CreditCard className="w-3.5 h-3.5" />
                    Ver crédito
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
