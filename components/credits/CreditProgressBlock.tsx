'use client';

import type { Credit } from '@/modules/credits';

/**
 * Bloque de "Progreso del préstamo" — ÚNICA fuente visual, compartida por el dashboard
 * (ActiveLoanCard) y el detalle del crédito. Antes cada vista lo dibujaba por su cuenta
 * y el porcentaje no coincidía: el dashboard hacía totalPaid/totalDue (sin mora, ~51%)
 * y el detalle usaba el progreso del backend (con mora, ~28%).
 *
 * Reglas de los montos (confirmadas contra el backend, CreditQueryReader):
 *   - totalDue        = suma de cuotas (SIN mora)
 *   - totalPenalty    = mora acumulada
 *   - totalPaid       = lo pagado (cuota + mora)
 *   - totalOutstanding = totalDue + totalPenalty − totalPaid  (por eso puede ser > totalDue)
 *
 * El progreso se calcula sobre la base CON mora, para que cierre con el "Pendiente":
 *   progreso = totalPaid / (totalDue + totalPenalty)
 * Así el mismo crédito muestra el mismo % en todos lados, y la mora se ve explícita
 * para que "Pendiente" deje de parecer un error (antes Pendiente > Total sin explicación).
 */

function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  credit: Credit;
  /** Progreso del backend (summary.progressPercentage). Si no se pasa, se calcula local. */
  progressPercentage?: number;
  /** Texto de pie opcional (ej. "1 de 3 cuotas pagadas · Finaliza el ..."). */
  footer?: React.ReactNode;
}

export function CreditProgressBlock({ credit, progressPercentage, footer }: Props) {
  const base = credit.totalDue + credit.totalPenalty;
  const computed = base > 0 ? Math.round((credit.totalPaid / base) * 100) : 0;
  const progress = Math.max(0, Math.min(100, Math.round(progressPercentage ?? computed)));

  const hasPenalty = credit.totalPenalty > 0;

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Progreso del préstamo</p>
        <p className="text-sm font-bold text-foreground">{progress}% completado</p>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-accent-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Montos — con mora visible solo cuando existe, para que el "Pendiente" cuadre a la vista */}
      <div className={`grid gap-2 pt-1 ${hasPenalty ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        <div className="rounded-md border border-border bg-background p-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">Total en cuotas</p>
          <p className="text-base font-bold text-foreground">{formatCurrencyShort(credit.totalDue)}</p>
        </div>

        <div className="rounded-md border border-accent-200 bg-accent-50 p-2.5">
          <p className="text-xs text-accent-800 mb-0.5">Pagado</p>
          <p className="text-base font-bold text-accent-700">{formatCurrencyShort(credit.totalPaid)}</p>
        </div>

        {hasPenalty && (
          <div className="rounded-md border border-warning-100 bg-warning-50 p-2.5">
            <p className="text-xs text-warning-700 mb-0.5">Mora acumulada</p>
            <p className="text-base font-bold text-warning-700">{formatCurrencyShort(credit.totalPenalty)}</p>
          </div>
        )}

        <div className="rounded-md border border-error-200 bg-error-50 p-2.5">
          <p className="text-xs text-error-700 mb-0.5">Pendiente total</p>
          <p className="text-base font-bold text-error-700">{formatCurrencyShort(credit.totalOutstanding)}</p>
        </div>
      </div>

      {hasPenalty && (
        <p className="text-[10px] text-muted-foreground">
          El pendiente incluye S/ {credit.totalPenalty.toFixed(2)} de mora acumulada por el atraso.
        </p>
      )}

      {footer}
    </div>
  );
}
