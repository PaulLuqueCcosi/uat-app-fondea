'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  InstallmentList,
  InstallmentDetailPanel,
  InstallmentCalendar,
  CalendarLegend,
  MonthSelector,
} from '@/components/credits';
import type { Credit, Installment } from '@/lib/credits/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActiveLoanCardProps {
  credit: Credit;
}

/**
 * Card de "Tu Préstamo Actual" para el dashboard.
 * Recibe un `Credit` completo — no fetchea datos ni define tipos.
 */
export function ActiveLoanCard({ credit }: ActiveLoanCardProps) {
  const progressPercent = Math.round((credit.paidAmount / credit.amount) * 100);

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const initialMonth = credit.installments.find((i) => i.status === 'OVERDUE' || i.status === 'PENDING');
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    initialMonth ? new Date(initialMonth.dueDate) : new Date()
  );
  const [visibleMonths, setVisibleMonths] = useState(2);

  const handleSelectInstallment = (inst: Installment) => {
    setSelectedInstallment(inst);
    // Asegurar que el mes de la cuota sea visible en el calendario
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
          <span>{formatCurrencyShort(credit.amount)} · {credit.totalInstallments} cuotas</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-base font-bold text-success-700">
              {formatCurrency(credit.paidAmount)}
            </p>
            <p className="text-[9px] text-muted-foreground">Pagado</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-foreground">
              {formatCurrency(credit.pendingBalance)}
            </p>
            <p className="text-[9px] text-muted-foreground">Pendiente</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-primary">{progressPercent}%</p>
            <p className="text-[9px] text-muted-foreground">Avance</p>
          </div>
        </div>

        <Separator />

        {/* 2 columnas: 2/3 calendario | 1/3 cuotas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendario — 2/3 del ancho, centrado, scroll horizontal si crece */}
          <div className="lg:col-span-2 flex flex-col items-center gap-2">
            <div className="w-full overflow-x-auto flex justify-center">
              <InstallmentCalendar
                installments={credit.installments}
                selectedInstallment={selectedInstallment}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onDayClick={handleSelectInstallment}
                numberOfMonths={visibleMonths}
              />
            </div>
            {/* Leyenda + selector meses */}
            <div className="flex items-center justify-between w-full px-2">
              <CalendarLegend />
              <MonthSelector value={visibleMonths} onChange={setVisibleMonths} />
            </div>
          </div>

          {/* Lista de cuotas — 1/3 del ancho */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            <InstallmentList
              installments={credit.installments}
              selectedId={selectedInstallment?.id}
              onSelect={handleSelectInstallment}
              maxVisible={4}
            />

            {/* Detalle o quick actions */}
            {selectedInstallment && (
              <InstallmentDetailPanel
                installment={selectedInstallment}
                creditId={credit.id}
                onClose={() => setSelectedInstallment(null)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
