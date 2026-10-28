import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/admin-formatters';
import { conceptLabel } from '@/modules/shared/charge-concepts';
import { groupCharges, type ChargeTotals } from '@/modules/shared/installment-charges';
import type { InstallmentChargeItem } from '@/modules/admin/admin-credit-detail.service';

/** Dónde está hoy la mora de una cuota vencida: días de atraso, tramo y cuándo cambia. */
export interface MoraContext {
  daysOverdue: number;
  /** "Mora avanzada (Días 11 a 20)"; null si el crédito no tiene tramos configurados. */
  stageText: string | null;
  /** Días que faltan para el siguiente tramo; null si es el último o no hay tramos. */
  daysToNextStage: number | null;
}

interface Props {
  charges: InstallmentChargeItem[];
  /** Totales de la cuota para cuando el backend no informa el detalle por concepto. */
  fallback: { amountDue: number; amountPaid: number; penaltyAccrued: number; penaltyPaid: number };
  mora: MoraContext | null;
}

const MONEY = 'font-mono tabular-nums';

function Line({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        {label}
        {hint && <span className="ml-1 text-[11px]">{hint}</span>}
      </span>
      <span className={MONEY}>{formatCurrency(value)}</span>
    </div>
  );
}

/** Líneas del detalle de un bloque, plegadas por defecto: lo necesario arriba y el desglose a pedido. */
function Fold({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group mt-1">
      <summary className="cursor-pointer select-none text-xs text-primary hover:underline">{summary}</summary>
      <div className="mt-2 space-y-1 border-l-2 pl-3">{children}</div>
    </details>
  );
}

function Block({ title, amount, tone = 'default', testId, children }: {
  title: string;
  amount: number;
  tone?: 'default' | 'danger';
  testId?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p data-testid={testId} className={`${MONEY} text-2xl font-semibold ${tone === 'danger' ? 'text-error-700' : ''}`}>
        {formatCurrency(amount)}
      </p>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <span aria-hidden className="self-center text-xl font-light text-muted-foreground max-md:hidden">
      {symbol}
    </span>
  );
}

function paidLine(totals: ChargeTotals) {
  return totals.paid > 0 ? <Line label="Pagado" value={totals.paid} /> : null;
}

/**
 * Resumen de la cuota en una sola mirada: la cuota (capital + interés de la cuota), la mora por el atraso y el
 * total que falta pagar. El desglose por tipo y por concepto queda plegado; el orden de pago y el detalle completo
 * viven en las pestañas de abajo.
 */
export function InstallmentSummaryCard({ charges, fallback, mora }: Props) {
  const g = groupCharges(charges);
  const hasDetail = charges.length > 0;

  const cuota: ChargeTotals = hasDetail
    ? {
        total: (g.principal?.item.total ?? 0) + g.interestTotals.total,
        paid: (g.principal?.item.paid ?? 0) + g.interestTotals.paid,
        outstanding: (g.principal?.item.outstanding ?? 0) + g.interestTotals.outstanding,
      }
    : {
        total: fallback.amountDue,
        paid: fallback.amountPaid,
        outstanding: Math.max(0, fallback.amountDue - fallback.amountPaid),
      };
  const penalty: ChargeTotals = hasDetail
    ? g.penaltyTotals
    : {
        total: fallback.penaltyAccrued,
        paid: fallback.penaltyPaid,
        outstanding: Math.max(0, fallback.penaltyAccrued - fallback.penaltyPaid),
      };
  const showMora = penalty.total > 0 || mora !== null;

  const grandTotal = cuota.total + penalty.total;
  const grandPaid = cuota.paid + penalty.paid;
  const grandOutstanding = cuota.outstanding + penalty.outstanding;
  const progress = grandTotal > 0 ? Math.min(100, Math.round((grandPaid / grandTotal) * 100)) : 0;

  return (
    <Card data-testid="installment-summary">
      <CardContent>
        <div className="flex flex-col gap-3 md:flex-row">
          <Block title="Monto de la cuota" amount={cuota.total} testId="summary-cuota-total">
            {g.principal && <Line label="Capital" value={g.principal.item.total} />}
            <Line label="Interés de la cuota" value={g.interestTotals.total} />
            {g.interestBlock === null && g.interestCategories.length > 0 && (
              <Fold summary="Ver el interés por tipo">
                {g.interestCategories.map((category) => {
                  const igv = category.rows.reduce((acc, row) => acc + (row.item.igv ?? 0), 0);
                  return (
                    <Line
                      key={category.concept}
                      label={conceptLabel(category.concept)}
                      value={category.total}
                      hint={igv > 0 ? `incluye IGV ${formatCurrency(igv)}` : undefined}
                    />
                  );
                })}
              </Fold>
            )}
            {paidLine(cuota)}
          </Block>

          {showMora && (
            <>
              <Operator symbol="+" />
              <Block title="Mora por el atraso" amount={penalty.total} tone="danger" testId="summary-mora-total">
                {mora && (
                  <>
                    <p className="text-sm">
                      {mora.daysOverdue} {mora.daysOverdue === 1 ? 'día' : 'días'} de atraso
                    </p>
                    {mora.stageText && <p className="text-xs text-muted-foreground">Tramo: {mora.stageText}</p>}
                    <p className="text-xs text-muted-foreground">
                      {mora.daysToNextStage !== null
                        ? `Cambia de tramo en ${mora.daysToNextStage} ${mora.daysToNextStage === 1 ? 'día' : 'días'}`
                        : mora.stageText
                          ? 'Es el último tramo'
                          : null}
                    </p>
                  </>
                )}
                {g.penalties.length > 0 && (
                  <Fold summary="Ver la mora por concepto">
                    {g.penalties.map((row) => (
                      <Line key={row.item.concept ?? row.order} label={conceptLabel(row.item.concept ?? '')} value={row.item.total} />
                    ))}
                  </Fold>
                )}
                {paidLine(penalty)}
              </Block>
            </>
          )}

          <Operator symbol="=" />
          <div className="flex-1 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">{showMora ? 'Total de la cuota con mora' : 'Total de la cuota'}</p>
            <p className={`${MONEY} text-2xl font-semibold`}>{formatCurrency(grandTotal)}</p>
            <div className="mt-3 space-y-1.5">
              <Line label="Pagado" value={grandPaid} />
              <div className="flex items-baseline justify-between gap-3 text-sm font-semibold">
                <span>Falta pagar</span>
                <span className={`${MONEY} text-primary`} data-testid="summary-outstanding">{formatCurrency(grandOutstanding)}</span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Progreso de pago de la cuota"
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground">{progress} % pagado</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
