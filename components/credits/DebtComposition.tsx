import { formatCurrency } from '@/lib/admin-formatters';

/** De qué está hecha una deuda. El orden es fijo: capital, interés y mora (nunca se reordena por monto). */
export type DebtPart = 'capital' | 'interest' | 'mora';

export interface DebtSegment {
  part: DebtPart;
  amount: number;
}

const PARTS: Record<DebtPart, { label: string; dot: string }> = {
  capital: { label: 'Capital', dot: 'bg-primary-600' },
  interest: { label: 'Intereses y gastos', dot: 'bg-warning-500' },
  mora: { label: 'Mora', dot: 'bg-error-600' },
};

const ORDER: DebtPart[] = ['capital', 'interest', 'mora'];

/** Clase del punto de color de cada parte: la misma de la barra, para usarla de leyenda en otras listas. */
export const debtPartDot = (part: DebtPart) => PARTS[part].dot;

interface Props {
  segments: DebtSegment[];
  /** Descripción para lectores de pantalla, ej. "Composición de lo que falta pagar". */
  label: string;
  /** Leyenda con montos bajo la barra. Se apaga cuando la lista de al lado ya lleva los puntos de color. */
  legend?: boolean;
}

/**
 * Una sola barra apilada que muestra de qué se compone lo que se debe, con su leyenda. Los montos van como texto
 * normal al lado de un punto de color: el color identifica, nunca es lo único que informa.
 */
export function DebtComposition({ segments, label, legend = true }: Props) {
  const visible = ORDER.flatMap((part) => {
    const segment = segments.find((s) => s.part === part);
    return segment && segment.amount > 0.004 ? [segment] : [];
  });
  const total = visible.reduce((sum, s) => sum + s.amount, 0);
  if (visible.length === 0 || total <= 0) return null;

  return (
    <div className="space-y-2" data-testid="debt-composition">
      <div role="img" aria-label={label} className="flex h-3 w-full gap-0.5">
        {visible.map((segment, index) => {
          const { label: partLabel, dot } = PARTS[segment.part];
          const share = Math.round((segment.amount / total) * 100);
          const rounding = `${index === 0 ? 'rounded-l' : ''} ${index === visible.length - 1 ? 'rounded-r' : ''}`;
          return (
            <div
              key={segment.part}
              title={`${partLabel} · ${formatCurrency(segment.amount)} · ${share} %`}
              className={`h-full min-w-1 ${dot} ${rounding}`}
              style={{ flexGrow: segment.amount }}
            />
          );
        })}
      </div>
      {legend && (
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {visible.map((segment) => (
          <li key={segment.part} className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${PARTS[segment.part].dot}`} />
            <span className="text-muted-foreground">{PARTS[segment.part].label}</span>
            <span className="font-medium tabular-nums text-foreground">{formatCurrency(segment.amount)}</span>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
