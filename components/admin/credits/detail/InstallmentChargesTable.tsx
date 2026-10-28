import { formatCurrency } from '@/lib/admin-formatters';
import { conceptLabel } from '@/modules/shared/charge-concepts';
import { bucketLabel } from '@/modules/shared/fee-labels';
import type { InstallmentChargeItem } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  items: InstallmentChargeItem[];
}

type ChargeState = 'covered' | 'partial' | 'pending';

function stateOf(item: InstallmentChargeItem): ChargeState {
  if (item.outstanding <= 0 && item.total > 0) return 'covered';
  return item.paid > 0 ? 'partial' : 'pending';
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

/**
 * Estado de cada concepto de la cuota en el orden en que un pago lo cubre (primero la mora, luego cada fee y al
 * final el capital): cuánto es, cuánto se pagó y cuánto falta. En un fee el total incluye el IGV, que se muestra
 * aparte solo como dato.
 */
export function InstallmentChargesTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin detalle por concepto</p>;
  }
  return (
    <div className="rounded-md border overflow-hidden overflow-x-auto">
      <table className="w-full text-xs">
        <caption className="sr-only">Estado de cada concepto de la cuota, en el orden en que un pago los cubre</caption>
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Concepto</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">IGV incluido</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Pagado</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Falta</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const state = stateOf(item);
            return (
              <tr key={`${item.type}-${item.feeCode ?? item.concept ?? index}`} className="border-t">
                <td className="py-2 px-3">
                  <span className="block">{bucketLabel(item.type, item.concept, item.feeCode)}</span>
                  {item.type === 'FEE' && item.concept
                    && conceptLabel(item.concept) !== bucketLabel(item.type, item.concept, item.feeCode) && (
                    <span className="block text-[10px] text-muted-foreground">{conceptLabel(item.concept)}</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.total)}</td>
                <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                  {item.igv != null ? formatCurrency(item.igv) : '—'}
                </td>
                <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.paid)}</td>
                <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.outstanding)}</td>
                <td className="py-2 px-3">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATE_STYLE[state]}`}>
                    {STATE_LABEL[state]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
