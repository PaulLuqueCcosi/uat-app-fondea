import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DataRow } from '@/components/ui/data-row';
import { formatCurrency, formatDate } from '@/lib/admin-formatters';
import { conceptLabel } from '@/modules/shared/charge-concepts';
import { creditStatusInfo } from '@/modules/admin/credit-status-labels';
import type {
  AdminCreditSummary,
  InstallmentItem,
  PenaltyBreakdownItem,
} from '@/modules/admin/admin-credit-detail.service';
import { Fold, Line, SummaryBlock } from './summary-parts';

interface Props {
  data: AdminCreditSummary;
  installments: InstallmentItem[];
  /** Lo que debe hoy el crédito, mora incluida: total_outstanding de /detail, la fuente de verdad (ver page.tsx). */
  totalOutstanding: number;
  /** Mora del crédito por concepto. */
  penaltyBreakdown: PenaltyBreakdownItem[];
}

const sum = (values: number[]) => Math.round(values.reduce((acc, v) => acc + v, 0) * 100) / 100;

function Chip({ children, tone }: { children: ReactNode; tone: 'good' | 'bad' | 'muted' }) {
  const style = {
    good: 'bg-emerald-50 text-emerald-700',
    bad: 'bg-error-100 text-error-700',
    muted: 'bg-muted text-muted-foreground',
  }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{children}</span>;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Resumen de todo el crédito en una mirada: en qué estado está, qué se pactó, cuánto se pagó y cuánto debe hoy
 * (cuotas y mora por separado). Los detalles viven en las pestañas de abajo.
 */
export function CreditSummaryCard({ data, installments, totalOutstanding, penaltyBreakdown }: Props) {
  const status = creditStatusInfo(data.status);
  const isNegotiation = data.creditType === 'NEGOTIATION';
  const closed = data.status === 'PAID_OFF';

  const overdue = installments.filter((i) => i.status === 'OVERDUE');
  const paid = installments.filter((i) => i.status === 'PAID');
  const negotiated = installments.filter((i) => i.status === 'NEGOTIATED');
  const upcoming = installments
    .filter((i) => !['PAID', 'OVERDUE', 'NEGOTIATED'].includes(i.status))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const next = upcoming[0] ?? null;
  const maxDaysOverdue = Math.max(0, ...overdue.map((i) => i.days_overdue));

  // Pactado, pagado y debe hoy. Lo pagado de las cuotas nunca pasa del monto de cada cuota; la mora va aparte.
  const interest = data.totalDue - data.principal;
  const paidInstallments = sum(installments.map((i) => Math.min(i.amount_paid, i.amount_due)));
  const penaltyPaid = sum(penaltyBreakdown.map((p) => p.paid));
  const penaltyOwed = sum(penaltyBreakdown.map((p) => p.outstanding));
  const installmentsOwed = Math.max(0, Math.round((totalOutstanding - penaltyOwed) * 100) / 100);
  const progress = data.totalDue > 0 ? Math.max(0, Math.min(100, Math.round((paidInstallments / data.totalDue) * 100))) : 0;

  let headline = status.label;
  let detail = status.description;
  let Icon = Clock;
  let iconTone = 'bg-muted text-muted-foreground';
  if (data.status === 'OVERDUE') {
    headline = `En mora: ${plural(overdue.length, 'cuota vencida', 'cuotas vencidas')}`;
    detail = `La más atrasada lleva ${plural(maxDaysOverdue, 'día', 'días')}${data.overdueSince ? ` · en mora desde ${formatDate(data.overdueSince)}` : ''}`;
    Icon = AlertCircle;
    iconTone = 'bg-error-100 text-error-700';
  } else if (data.status === 'ACTIVE') {
    headline = 'Al día';
    detail = next
      ? `Próxima cuota: #${next.installment_no} el ${formatDate(next.due_date)} por ${formatCurrency(next.amount_due - next.amount_paid)}`
      : 'Sin cuotas por vencer';
    Icon = CheckCircle2;
    iconTone = 'bg-emerald-50 text-emerald-700';
  } else if (closed) {
    headline = 'Liquidado';
    detail = data.closedAt ? `Cerrado el ${formatDate(data.closedAt)}` : 'Sin deuda pendiente';
    Icon = CheckCircle2;
    iconTone = 'bg-emerald-50 text-emerald-700';
  }

  return (
    <Card data-testid="credit-summary">
      <CardContent className="space-y-5">
        {/* Estado */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground" data-testid="summary-headline">{headline}</p>
              <p className="text-sm text-muted-foreground">{detail}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5" data-testid="summary-chips">
            <Chip tone="good">{plural(paid.length, 'cuota pagada', 'cuotas pagadas')}</Chip>
            {overdue.length > 0 && <Chip tone="bad">{plural(overdue.length, 'vencida', 'vencidas')}</Chip>}
            {upcoming.length > 0 && <Chip tone="muted">{plural(upcoming.length, 'por vencer', 'por vencer')}</Chip>}
            {negotiated.length > 0 && <Chip tone="muted">{plural(negotiated.length, 'negociada', 'negociadas')}</Chip>}
          </div>
        </div>

        {/* Fechas clave */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 md:grid-cols-4">
          <DataRow label={isNegotiation ? 'Vigente desde' : 'Desembolso'} value={formatDate(data.disbursedAt)} />
          <DataRow label="Próximo vencimiento" value={next ? formatDate(next.due_date) : '—'} />
          <DataRow label="Vencimiento final" value={formatDate(data.maturityDate)} />
          <DataRow label="En mora desde" value={data.overdueSince ? formatDate(data.overdueSince) : '—'} alert={!!data.overdueSince} />
        </div>

        {/* Pactado · pagado · debe hoy */}
        <div className="flex flex-col gap-3 md:flex-row">
          <SummaryBlock title="Total pactado" amount={data.totalDue} testId="summary-pactado">
            <Line label={isNegotiation ? 'Deuda negociada' : 'Capital'} value={data.principal} />
            <Line label="Interés de las cuotas" value={interest} />
            <p className="pt-1 text-[11px] text-muted-foreground">
              {plural(data.installmentCount, 'cuota', 'cuotas')} · plazo de {data.termDays} días
            </p>
          </SummaryBlock>

          <SummaryBlock title="Ya pagado" amount={paidInstallments + penaltyPaid} testId="summary-pagado">
            <Line label="De las cuotas" value={paidInstallments} />
            {penaltyPaid > 0 && <Line label="De la mora" value={penaltyPaid} />}
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Progreso de pago del crédito"
              className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground" data-testid="summary-progress">{progress} % de lo pactado</p>
          </SummaryBlock>

          <SummaryBlock title={closed ? 'Debe hoy' : 'Debe hoy (cuotas + mora)'} amount={totalOutstanding} tone="primary" testId="summary-debe-hoy">
            <Line label="Cuotas pendientes" value={installmentsOwed} />
            <Line label="Mora pendiente" value={penaltyOwed} tone={penaltyOwed > 0 ? 'danger' : undefined} />
            {penaltyBreakdown.length > 0 && (
              <Fold summary="Ver la mora por concepto" testId="summary-mora-detail">
                {penaltyBreakdown.map((item) => (
                  <Line key={item.concept} label={conceptLabel(item.concept)} value={item.outstanding} />
                ))}
              </Fold>
            )}
          </SummaryBlock>
        </div>
      </CardContent>
    </Card>
  );
}
