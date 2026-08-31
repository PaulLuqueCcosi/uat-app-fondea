'use client';

import { Calendar } from '@/components/ui/calendar';
import { es } from 'react-day-picker/locale';
import type { Installment, InstallmentViewStatus } from '@/modules/credits';
import { getInstallmentViewStatus, installmentViewStatusLabels } from '@/modules/credits';
import { parseBackendDate } from '@/modules/shared/backend-date';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Ver `modules/shared/backend-date`: sin este parseo el calendario marcaba el día anterior
// al vencimiento y `onDayClick` no encontraba la cuota al tocar el día correcto.
const parseDueDate = parseBackendDate;

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
  // Se agrupa por estado VISIBLE: una cuota vencida con comprobante en revisión se pinta
  // como "en revisión", no en rojo — el cliente ya pagó y la mora está detenida.
  const datesByStatus = (target: InstallmentViewStatus) =>
    installments
      .filter((i) => getInstallmentViewStatus(i).status === target)
      .map((i) => parseDueDate(i.dueDate));

  const paidDates = datesByStatus('PAID');
  const underReviewDates = datesByStatus('UNDER_REVIEW');
  const currentDates = [...datesByStatus('CURRENT'), ...datesByStatus('PARTIALLY_PAID')];
  const pendingDates = datesByStatus('PENDING');
  const overdueDates = datesByStatus('OVERDUE');
  const negotiatedDates = datesByStatus('NEGOTIATED');
  const selectedDate = selectedInstallment
    ? [parseDueDate(selectedInstallment.dueDate)]
    : [];

  const handleDayClick = (day: Date) => {
    const found = installments.find((inst) => isSameDay(parseDueDate(inst.dueDate), day));
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
        underReview: underReviewDates,
        current: currentDates,
        pending: pendingDates,
        overdue: overdueDates,
        negotiated: negotiatedDates,
        active: selectedDate,
      }}
      modifiersClassNames={{
        paid: 'bg-accent-500 text-accent-900 hover:bg-accent-400 font-bold cursor-pointer',
        underReview: 'bg-primary-400 text-white hover:bg-primary-500 font-bold cursor-pointer',
        current: 'bg-warning-400 text-warning-900 hover:bg-warning-500 font-bold cursor-pointer',
        pending: 'bg-primary-200 text-primary-900 hover:bg-primary-300 font-bold cursor-pointer',
        overdue: 'bg-error-500 text-white hover:bg-error-600 font-bold cursor-pointer',
        negotiated: 'bg-primary-600 text-white hover:bg-primary-700 font-bold cursor-pointer',
        active: 'ring-2 ring-offset-2 ring-primary scale-110',
      }}
      numberOfMonths={numberOfMonths}
      className="rounded-lg border border-border"
    />
  );
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────

/**
 * Los textos salen de `installmentViewStatusLabels` — la misma fuente que los badges de
 * las cuotas. Antes estaban escritos a mano acá y ya habían divergido: la leyenda decía
 * "Próxima" para el mismo estado que el badge llamaba "Por pagar".
 *
 * <p>El color acompaña al `modifiersClassNames` de arriba, así que se mantiene explícito.
 */
const LEGEND_ITEMS: Array<{ status: InstallmentViewStatus; dot: string }> = [
  { status: 'PAID', dot: 'bg-accent-500' },
  { status: 'OVERDUE', dot: 'bg-error-500' },
  { status: 'UNDER_REVIEW', dot: 'bg-primary-400' },
  { status: 'CURRENT', dot: 'bg-warning-400' },
  { status: 'PENDING', dot: 'bg-primary-200' },
  { status: 'NEGOTIATED', dot: 'bg-primary-600' },
];

export function CalendarLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {LEGEND_ITEMS.map(({ status, dot }) => (
        <div key={status} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
          <span className="text-xs text-muted-foreground">
            {installmentViewStatusLabels[status]}
          </span>
        </div>
      ))}
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
