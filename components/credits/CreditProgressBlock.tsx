'use client';

import type { Credit } from '@/modules/credits';
import { DebtComposition, type DebtSegment } from './DebtComposition';

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
  /** De qué se compone lo que falta pagar (capital, interés y mora); sin esto no se dibuja la barra. */
  pendingBreakdown?: DebtSegment[];
  /**
   * Versión resumida para el inicio: lo que falta pagar en chico, la barra y las cifras de referencia
   * plegadas en "Ver detalle". La alerta del próximo pago ya dice cuánto pagar y cuándo; el detalle completo
   * está en la pantalla del crédito.
   */
  compact?: boolean;
}

export function CreditProgressBlock({ credit, progressPercentage, footer, pendingBreakdown, compact = false }: Props) {
  const base = credit.totalDue + credit.totalPenalty;
  const computed = base > 0 ? Math.round((credit.totalPaid / base) * 100) : 0;
  const progress = Math.max(0, Math.min(100, Math.round(progressPercentage ?? computed)));

  const hasPenalty = credit.totalPenalty > 0;

  // La barra solo se dibuja si las partes suman exactamente lo que falta pagar.
  const breakdownTotal = (pendingBreakdown ?? []).reduce((sum, s) => sum + s.amount, 0);
  const showBreakdown =
    pendingBreakdown !== undefined && Math.round(breakdownTotal * 100) === Math.round(credit.totalOutstanding * 100);

  // Solo la barra: el avance se ve, sin un porcentaje que compita con los montos.
  const bar = (
    <div
      role="progressbar"
      aria-label="Progreso del préstamo"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100"
    >
      <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${progress}%` }} />
    </div>
  );

  // Cifras de referencia — sin cajas, separadas por una línea fina.
  const reference = (
    <>
      <dl className="grid grid-cols-2 gap-y-3 sm:grid-cols-3 sm:divide-x">
        <div className="sm:pr-4">
          <dt className="text-xs text-muted-foreground">Total en cuotas</dt>
          <dd className="text-base font-semibold tabular-nums text-foreground">{formatCurrencyShort(credit.totalDue)}</dd>
        </div>
        <div className="sm:px-4">
          <dt className="text-xs text-muted-foreground">Pagado</dt>
          <dd className="text-base font-semibold tabular-nums text-accent-700">{formatCurrencyShort(credit.totalPaid)}</dd>
        </div>
        {hasPenalty && (
          <div className="col-span-2 sm:col-span-1 sm:pl-4">
            <dt className="text-xs text-muted-foreground">Mora acumulada</dt>
            <dd className="text-base font-semibold tabular-nums text-error-700">{formatCurrencyShort(credit.totalPenalty)}</dd>
          </div>
        )}
      </dl>
    </>
  );

  if (compact) {
    return (
      <section className="space-y-3" data-testid="credit-progress">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted-foreground">Falta pagar en todo el crédito</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{formatCurrencyShort(credit.totalOutstanding)}</p>
        </div>
        {bar}
        <details className="group">
          <summary className="cursor-pointer select-none text-xs text-primary hover:underline">Ver detalle</summary>
          <div className="mt-3 border-t pt-3">{reference}</div>
        </details>
        {footer}
      </section>
    );
  }

  return (
    <section className="space-y-4" data-testid="credit-progress">
      <div>
        <p className="text-sm text-muted-foreground">Pendiente total</p>
        <p className="text-4xl font-semibold tabular-nums text-foreground">{formatCurrencyShort(credit.totalOutstanding)}</p>
      </div>

      {bar}

      {showBreakdown && pendingBreakdown && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-muted-foreground">De qué es lo que falta pagar</p>
          <DebtComposition segments={pendingBreakdown} label="De qué se compone lo que falta pagar" />
        </div>
      )}

      <div className="border-t pt-4">{reference}</div>

      {footer}
    </section>
  );
}
