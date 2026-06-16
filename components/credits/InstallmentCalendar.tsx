'use client';

import { Calendar } from '@/components/ui/calendar';
import { es } from 'react-day-picker/locale';
import type { Installment } from '@/lib/credits/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InstallmentCalendarProps {
  installments: Installment[];
  selectedInstallment?: Installment | null;
  month: Date;
  onMonthChange: (month: Date) => void;
  onDayClick: (installment: Installment) => void;
  numberOfMonths: number;
}

/**
 * Calendario de cuotas con modifiers por estado.
 * Reutilizable en dashboard y detalle de crédito.
 */
export function InstallmentCalendar({
  installments,
  selectedInstallment,
  month,
  onMonthChange,
  onDayClick,
  numberOfMonths,
}: InstallmentCalendarProps) {
  const paidDates = installments
    .filter((i) => i.status === 'PAID')
    .map((i) => new Date(i.dueDate));
  const pendingDates = installments
    .filter((i) => i.status === 'PENDING')
    .map((i) => new Date(i.dueDate));
  const upcomingDates = installments
    .filter((i) => i.status === 'UPCOMING')
    .map((i) => new Date(i.dueDate));
  const overdueDates = installments
    .filter((i) => i.status === 'OVERDUE')
    .map((i) => new Date(i.dueDate));
  const selectedDate = selectedInstallment
    ? [new Date(selectedInstallment.dueDate)]
    : [];

  const handleDayClick = (day: Date) => {
    const found = installments.find((inst) => isSameDay(new Date(inst.dueDate), day));
    if (found) onDayClick(found);
  };

  return (
    <Calendar
      locale={es}
      onDayClick={handleDayClick}
      month={month}
      onMonthChange={onMonthChange}
      modifiers={{
        paid: paidDates,
        pending: pendingDates,
        upcoming: upcomingDates,
        overdue: overdueDates,
        active: selectedDate,
      }}
      modifiersClassNames={{
        paid: 'bg-accent-500 text-accent-900 hover:bg-accent-400 font-bold cursor-pointer',
        pending: 'bg-warning-400 text-warning-900 hover:bg-warning-500 font-bold cursor-pointer',
        upcoming: 'bg-primary-200 text-primary-900 hover:bg-primary-300 font-bold cursor-pointer',
        overdue: 'bg-error-500 text-white hover:bg-error-600 font-bold cursor-pointer',
        active: 'ring-2 ring-offset-2 ring-primary scale-110',
      }}
      numberOfMonths={numberOfMonths}
      className="rounded-lg border border-border"
    />
  );
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────

export function CalendarLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-accent-500" />
        <span className="text-xs text-muted-foreground">Pagada</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-error-500" />
        <span className="text-xs text-muted-foreground">Vencida</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-warning-400" />
        <span className="text-xs text-muted-foreground">Próxima</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-primary-200" />
        <span className="text-xs text-muted-foreground">Futura</span>
      </div>
    </div>
  );
}

// ─── Selector de meses visibles ───────────────────────────────────────────────

interface MonthSelectorProps {
  value: number;
  onChange: (months: number) => void;
  options?: number[];
}

export function MonthSelector({ value, onChange, options = [1, 2, 3, 4] }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
      {options.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            value === n
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {n}M
        </button>
      ))}
    </div>
  );
}
