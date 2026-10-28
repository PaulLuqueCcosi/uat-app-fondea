import { formatCurrency } from '@/lib/admin-formatters';
import { DebtComposition, debtPartDot, type DebtPart, type DebtSegment } from './DebtComposition';

interface Props {
  amountDue: number;
  amountPaid: number;
  penaltyAccrued: number;
  penaltyPaid: number;
  outstanding: number;
  daysOverdue: number;
  /** Cómo se compone la cuota; nulos si el backend no los informa. */
  principalAmount?: number | null;
  interestAmount?: number | null;
  principalPaid?: number | null;
  interestPaid?: number | null;
}

interface Row {
  key: string;
  label: string;
  hint: string;
  total: number;
  paid: number;
  part: DebtPart;
  tone?: 'danger';
}

const cents = (value: number) => Math.round(value * 100);

function LedgerRow({ row, withDot }: { row: Row; withDot: boolean }) {
  const pending = Math.max(0, row.total - row.paid);
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-2.5">
        {withDot && <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${debtPartDot(row.part)}`} />}
        <div>
          <dt className="text-sm font-medium text-foreground">{row.label}</dt>
          <dd className="text-xs text-muted-foreground">{row.hint}</dd>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold tabular-nums ${row.tone === 'danger' ? 'text-error-700' : 'text-foreground'}`}>
          {formatCurrency(pending)}
        </p>
        {row.paid > 0 && (
          <p className="text-xs text-muted-foreground">
            de {formatCurrency(row.total)} · pagaste {formatCurrency(row.paid)}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Cuánto debes de esta cuota y de qué es: arriba el total que falta, una barra con su composición y debajo, sin
 * cajas, cada parte (capital, intereses y gastos, mora) con una línea que dice qué es.
 */
export function InstallmentBalance(props: Props) {
  const { amountDue, amountPaid, penaltyAccrued, penaltyPaid, outstanding, daysOverdue } = props;
  const hasSplit = props.principalAmount != null && props.interestAmount != null;

  const rows: Row[] = hasSplit
    ? [
        {
          key: 'capital',
          label: 'Capital',
          hint: 'Lo que se te prestó',
          total: props.principalAmount ?? 0,
          paid: props.principalPaid ?? 0,
          part: 'capital',
        },
        {
          key: 'interest',
          label: 'Intereses y gastos',
          hint: 'El costo del préstamo',
          total: props.interestAmount ?? 0,
          paid: props.interestPaid ?? 0,
          part: 'interest',
        },
      ]
    : [{ key: 'cuota', label: 'Monto de la cuota', hint: 'Lo que corresponde pagar este período', total: amountDue, paid: amountPaid, part: 'interest' }];
  if (penaltyAccrued > 0) {
    rows.push({
      key: 'mora',
      label: 'Mora',
      hint: daysOverdue > 0 ? `Recargo por ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'} de atraso` : 'Recargo por pagar tarde',
      total: penaltyAccrued,
      paid: penaltyPaid,
      part: 'mora',
      tone: 'danger',
    });
  }

  const segments: DebtSegment[] = rows.map((row) => ({ part: row.part, amount: Math.max(0, row.total - row.paid) }));
  // La barra solo se muestra si las partes suman exactamente lo que falta; si no, mejor no dibujar algo que no cuadra.
  const composes = hasSplit && cents(segments.reduce((sum, s) => sum + s.amount, 0)) === cents(outstanding);

  return (
    <section aria-label="Cuánto debes de esta cuota" className="space-y-5" data-testid="installment-balance">
      <div>
        <p className="text-sm text-muted-foreground">Te falta pagar</p>
        <p className="text-4xl font-semibold tabular-nums text-foreground" data-testid="balance-outstanding">
          {formatCurrency(outstanding)}
        </p>
      </div>

      {/* Sin leyenda propia: los puntos de color de la lista de abajo ya hacen de leyenda. */}
      {composes && <DebtComposition segments={segments} legend={false} label="De qué se compone lo que falta pagar de esta cuota" />}

      <dl className="divide-y border-y">
        {rows.map((row) => (
          <LedgerRow key={row.key} row={row} withDot={composes} />
        ))}
      </dl>
    </section>
  );
}
