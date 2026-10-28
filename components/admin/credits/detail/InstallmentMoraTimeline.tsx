import { formatCurrency, formatDate } from '@/lib/admin-formatters';
import { conceptLabel, MATRIX_CONCEPTS } from '@/modules/shared/charge-concepts';
import type { PenaltyDay } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  days: PenaltyDay[];
  /** Mora acumulada de la cuota según el sistema; sirve para comprobar que la suma de los días coincide. */
  penaltyAccrued: number;
}

const MONEY = 'py-1.5 px-3 text-right font-mono whitespace-nowrap';

/**
 * La mora de la cuota día por día: qué se cobró cada día de atraso, por concepto, en qué tramo cayó el día y cuánto
 * va acumulado. Cuando el día entra a otro tramo se marca con una fila aparte. Los días se recalculan con la
 * configuración de mora del crédito; la comprobación del pie dice si la suma coincide con lo acumulado de la cuota.
 */
export function InstallmentMoraTimeline({ days, penaltyAccrued }: Props) {
  if (days.length === 0) {
    return <p className="text-xs text-muted-foreground">Todavía no se cobró mora día por día en esta cuota</p>;
  }

  const concepts = MATRIX_CONCEPTS.filter((concept) => days.some((day) => (day.charges[concept] ?? 0) > 0));
  const columns = 4 + concepts.length;
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const matches = Math.abs(total - penaltyAccrued) < 0.015;

  const rows = days.flatMap((day, index) => {
    const running = days.slice(0, index + 1).reduce((acc, d) => acc + d.total, 0);
    const out = [];
    if (index === 0 || day.stageLabel !== days[index - 1].stageLabel) {
      out.push(
        <tr key={`stage-${day.day}`} className="border-t bg-muted/40">
          <th colSpan={columns} scope="colgroup" className="px-3 py-1.5 text-left text-[11px] font-medium text-muted-foreground">
            {day.stageLabel ? `Desde el día ${day.day}: ${day.stageLabel}` : `Desde el día ${day.day}`}
          </th>
        </tr>,
      );
    }
    out.push(
      <tr key={day.day} className="border-t">
        <td className="py-1.5 px-3 text-center font-mono">{day.day}</td>
        <td className="py-1.5 px-3 whitespace-nowrap">{formatDate(day.date)}</td>
        {concepts.map((concept) => (
          <td key={concept} className={MONEY}>
            {(day.charges[concept] ?? 0) > 0 ? formatCurrency(day.charges[concept] ?? 0) : <span className="text-muted-foreground">—</span>}
          </td>
        ))}
        <td className={`${MONEY} font-medium`}>{formatCurrency(day.total)}</td>
        <td className={`${MONEY} text-muted-foreground`}>{formatCurrency(running)}</td>
      </tr>,
    );
    return out;
  });

  return (
    <div className="space-y-2">
      <div className="max-h-96 overflow-auto rounded-md border">
        <table className="w-full text-xs">
          <caption className="sr-only">Mora de la cuota día por día, por concepto, con el total del día y lo acumulado</caption>
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th scope="col" className="w-14 py-2 px-3 text-center font-medium text-muted-foreground">Día</th>
              <th scope="col" className="py-2 px-3 text-left font-medium text-muted-foreground">Fecha</th>
              {concepts.map((concept) => (
                <th key={concept} scope="col" className="py-2 px-3 text-right font-medium text-muted-foreground">
                  {conceptLabel(concept)}
                </th>
              ))}
              <th scope="col" className="py-2 px-3 text-right font-medium text-muted-foreground">Total del día</th>
              <th scope="col" className="py-2 px-3 text-right font-medium text-muted-foreground">Acumulado</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
          <tfoot className="sticky bottom-0 bg-muted">
            <tr className="border-t-2 font-semibold">
              <td className="py-2 px-3" colSpan={2 + concepts.length}>
                Total de {days.length} {days.length === 1 ? 'día' : 'días'}
              </td>
              <td className={MONEY}>{formatCurrency(total)}</td>
              <td className={MONEY}>{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={`text-[11px] ${matches ? 'text-emerald-700' : 'text-amber-700'}`}>
        {matches
          ? 'La suma de los días coincide con la mora acumulada de la cuota.'
          : `La suma de los días (${formatCurrency(total)}) no coincide con la mora acumulada de la cuota (${formatCurrency(penaltyAccrued)}). Puede deberse a pagos parciales o a días con la mora congelada.`}
      </p>
      <p className="text-[11px] text-muted-foreground">
        Cada día se calcula con la configuración de mora del crédito, según el tramo en que cae ese día de atraso.
      </p>
    </div>
  );
}
