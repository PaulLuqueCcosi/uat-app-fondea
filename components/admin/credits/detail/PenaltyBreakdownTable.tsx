import { formatCurrency } from '@/lib/admin-formatters';
import { conceptLabel } from '@/modules/shared/charge-concepts';
import type { PenaltyBreakdownItem } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  items: PenaltyBreakdownItem[];
}

/** Mora por concepto (solo admin). Sin filas, muestra "Sin mora": nunca una fila en cero. */
export function PenaltyBreakdownTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin mora</p>;
  }
  return (
    <div className="rounded-md border overflow-hidden overflow-x-auto">
      <table className="w-full text-xs whitespace-nowrap">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Concepto</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Acumulado</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Pagado</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Pendiente</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.concept} className="border-t">
              <td className="py-2 px-3">{conceptLabel(item.concept)}</td>
              <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.accrued)}</td>
              <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.paid)}</td>
              <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.outstanding)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
