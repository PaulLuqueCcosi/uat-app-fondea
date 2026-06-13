'use client';

import { useState } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  InstallmentList,
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

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActiveLoanCardProps {
  credit: Credit;
}

/**
 * Card de "Tu Préstamo Actual" para el dashboard.
 * Estructura basada en el diseño:
 * 1. Header con título + badge
 * 2. Alerta de cuota vencida (si aplica)
 * 3. Progreso del préstamo (barra + total/pagado/pendiente)
 * 4. Calendario (izq) + Cuotas (der) — 50/50
 */
export function ActiveLoanCard({ credit }: ActiveLoanCardProps) {
  const progressPercent = Math.round((credit.paidAmount / credit.amount) * 100);

  // Encontrar cuota vencida u overdue para la alerta
  const overdueInstallment = credit.installments.find((i) => i.status === 'OVERDUE');

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const initialMonth = credit.installments.find((i) => i.status === 'OVERDUE' || i.status === 'PENDING');
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    initialMonth ? new Date(initialMonth.dueDate) : new Date()
  );
  const [visibleMonths, setVisibleMonths] = useState(1);

  const handleSelectInstallment = (inst: Installment) => {
    // Toggle: si ya está seleccionada, deseleccionar
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
    <Card className='pt-0'>
      <CardContent className="p-4 md:p-6 space-y-4">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tu préstamo actual</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrencyShort(credit.amount)} · {credit.totalInstallments} cuotas
              </p>
            </div>
          </div>
          <Badge variant="success">Activo</Badge>
        </div>

        {/* ─── Alerta cuota vencida ─── */}
        {overdueInstallment && (
          <div className="flex items-center gap-3 rounded-lg border border-error-200 bg-error-50 p-3">
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
        )}

        {/* ─── Progreso del préstamo ─── */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          {/* Barra */}
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

          {/* Montos: Total | Pagado | Pendiente */}
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
        </div>

        {/* ─── Cuotas + Calendario (50/50) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Cuotas */}
          <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
            <InstallmentList
              installments={credit.installments}
              selectedId={selectedInstallment?.id}
              onSelect={handleSelectInstallment}
              creditId={credit.id}
              maxVisible={6}
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
    </Card>
  );
}
