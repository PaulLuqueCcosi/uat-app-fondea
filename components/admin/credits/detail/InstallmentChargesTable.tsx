import { formatCurrency } from '@/lib/admin-formatters';
import { conceptLabel, type ChargeConcept } from '@/modules/shared/charge-concepts';
import { feeLabel } from '@/modules/shared/fee-labels';
import {
  chargeState,
  groupCharges,
  type ChargeRow,
  type ChargeState,
  type ChargeTotals,
} from '@/modules/shared/installment-charges';
import type { InstallmentChargeItem } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  items: InstallmentChargeItem[];
}

const STATE_LABEL: Record<ChargeState, string> = {
  covered: 'Cubierto',
  partial: 'Parcial',
  pending: 'Pendiente',
};

const STATE_STYLE: Record<ChargeState, string> = {
  covered: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  pending: 'bg-muted text-muted-foreground',
};

/** Qué es cada concepto de la mora, en una línea, para quien no conoce el modelo. */
const PENALTY_HINT: Partial<Record<ChargeConcept, string>> = {
  INTERES_COMPENSATORIO: 'El interés de la cuota que sigue corriendo cada día de atraso',
  GASTOS: 'Gastos por el atraso, según el tramo',
  TARIFA: 'Tarifa por el atraso, según el tramo',
  INTERES_MORATORIO: 'Penalidad: tasa anual sobre el capital vencido',
};

const MONEY = 'py-1.5 px-3 text-right font-mono';

function StateBadge({ totals }: { totals: ChargeTotals }) {
  const state = chargeState(totals);
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATE_STYLE[state]}`}>{STATE_LABEL[state]}</span>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <tr className="border-t-2 bg-muted/50">
      <th colSpan={6} scope="colgroup" className="px-3 py-2 text-left">
        <span className="block text-xs font-semibold">{title}</span>
        <span className="block text-[11px] font-normal text-muted-foreground">{hint}</span>
      </th>
    </tr>
  );
}

/** Fila de un balde. `indent` sangra el nombre cuando es parte de un grupo; `igv` aparece como dato bajo el total. */
function Row({ row, label, hint, indent = 0 }: { row: ChargeRow; label: string; hint?: string; indent?: number }) {
  const { item } = row;
  return (
    <tr className="border-t">
      <td className="py-1.5 px-3 text-center font-mono text-[11px] text-muted-foreground">{row.order}</td>
      <td className="py-1.5 px-3" style={{ paddingLeft: `${12 + indent * 16}px` }}>
        <span className="block">{label}</span>
        {hint && <span className="block text-[10px] text-muted-foreground">{hint}</span>}
      </td>
      <td className={MONEY}>
        {formatCurrency(item.total)}
        {item.igv != null && (
          <span className="block text-[10px] font-sans text-muted-foreground">incluye IGV {formatCurrency(item.igv)}</span>
        )}
      </td>
      <td className={MONEY}>{formatCurrency(item.paid)}</td>
      <td className={MONEY}>{formatCurrency(item.outstanding)}</td>
      <td className="py-1.5 px-3">
        <StateBadge totals={item} />
      </td>
    </tr>
  );
}

/** Fila de subtotal de un grupo (sin número de orden: agrupa varios baldes). */
function SubtotalRow({ label, totals, indent = 0, strong = false }: { label: string; totals: ChargeTotals; indent?: number; strong?: boolean }) {
  return (
    <tr className={`border-t ${strong ? 'bg-muted/30 font-semibold' : 'font-medium'}`}>
      <td className="py-1.5 px-3" />
      <td className="py-1.5 px-3" style={{ paddingLeft: `${12 + indent * 16}px` }}>{label}</td>
      <td className={MONEY}>{formatCurrency(totals.total)}</td>
      <td className={MONEY}>{formatCurrency(totals.paid)}</td>
      <td className={MONEY}>{formatCurrency(totals.outstanding)}</td>
      <td className="py-1.5 px-3">
        <StateBadge totals={totals} />
      </td>
    </tr>
  );
}

/**
 * Todo lo que debe la cuota, en tres bloques: el capital, el interés de la cuota (por tipo: interés compensatorio,
 * gastos y tarifa) y la mora por el atraso. La columna "Orden" dice en qué secuencia los cubre un pago (1 = primero:
 * la mora, luego el interés de la cuota y al final el capital). El IGV de cada fee se muestra solo como dato.
 */
export function InstallmentChargesTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin detalle por concepto</p>;
  }
  const g = groupCharges(items);

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-hidden overflow-x-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">Detalle de la cuota: capital, interés de la cuota y mora, con lo pagado y lo que falta</caption>
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="w-14 py-2 px-3 text-center font-medium text-muted-foreground">Orden</th>
              <th scope="col" className="py-2 px-3 text-left font-medium text-muted-foreground">Concepto</th>
              <th scope="col" className="py-2 px-3 text-right font-medium text-muted-foreground">Total</th>
              <th scope="col" className="py-2 px-3 text-right font-medium text-muted-foreground">Pagado</th>
              <th scope="col" className="py-2 px-3 text-right font-medium text-muted-foreground">Falta</th>
              <th scope="col" className="py-2 px-3 text-left font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>

          <tbody>
            <SectionHeader title="Capital" hint="Lo prestado que corresponde a esta cuota" />
            {g.principal && <Row row={g.principal} label="Capital de la cuota" />}
          </tbody>

          <tbody>
            <SectionHeader title="Interés de la cuota" hint="Lo pactado al prestar, dividido por tipo" />
            {g.interestBlock ? (
              <Row row={g.interestBlock} label="Interés de la cuota" hint="Sin desglose por tipo" />
            ) : (
              g.interestCategories.map((category) => {
                const [only] = category.rows;
                if (category.rows.length > 1) {
                  return <CategoryGroup key={category.concept} concept={category.concept} rows={category.rows} totals={category} />;
                }
                // Un solo fee en el tipo: una fila, con el tipo como detalle (sin subtotal igual al fee).
                const label = only.item.feeCode ? feeLabel(only.item.feeCode) : conceptLabel(category.concept);
                return (
                  <Row
                    key={category.concept}
                    row={only}
                    label={label}
                    hint={label === conceptLabel(category.concept) ? undefined : conceptLabel(category.concept)}
                  />
                );
              })
            )}
            <SubtotalRow label="Total del interés de la cuota" totals={g.interestTotals} strong />
          </tbody>

          {g.penalties.length > 0 && (
            <tbody>
              <SectionHeader title="Mora por el atraso" hint="Se genera por cada día que la cuota está vencida" />
              {g.penalties.map((row) => (
                <Row
                  key={row.item.concept ?? row.order}
                  row={row}
                  label={conceptLabel(row.item.concept ?? '')}
                  hint={row.item.concept ? PENALTY_HINT[row.item.concept] : undefined}
                />
              ))}
              <SubtotalRow label="Total de la mora" totals={g.penaltyTotals} strong />
            </tbody>
          )}

          <tfoot>
            <tr className="border-t-2 bg-muted/50 font-semibold">
              <td className="py-2 px-3" />
              <td className="py-2 px-3">Total de la cuota con mora</td>
              <td className={MONEY.replace('py-1.5', 'py-2')}>{formatCurrency(g.grandTotals.total)}</td>
              <td className={MONEY.replace('py-1.5', 'py-2')}>{formatCurrency(g.grandTotals.paid)}</td>
              <td className={MONEY.replace('py-1.5', 'py-2')}>{formatCurrency(g.grandTotals.outstanding)}</td>
              <td className="py-2 px-3">
                <StateBadge totals={g.grandTotals} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Un pago cubre los conceptos en el orden de la primera columna: primero la mora, luego el interés de la cuota y al
        final el capital. El IGV de cada fee ya está incluido en su total.
      </p>
    </div>
  );
}

/** Un tipo del interés de la cuota (por ejemplo "Gastos") con su subtotal y los fee que lo componen. */
function CategoryGroup({ concept, rows, totals }: { concept: ChargeConcept; rows: ChargeRow[]; totals: ChargeTotals }) {
  return (
    <>
      <SubtotalRow label={conceptLabel(concept)} totals={totals} indent={0} />
      {rows.map((row) => (
        <Row key={row.item.feeCode ?? row.order} row={row} label={row.item.feeCode ? feeLabel(row.item.feeCode) : conceptLabel(concept)} indent={1} />
      ))}
    </>
  );
}
