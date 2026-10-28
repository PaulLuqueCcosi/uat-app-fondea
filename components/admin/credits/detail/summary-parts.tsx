import type { ReactNode } from 'react';
import { formatCurrency } from '@/lib/admin-formatters';

/** Piezas compartidas por los resúmenes de la cuota y del crédito: una línea, un bloque y un desglose plegable. */

export const MONEY = 'font-mono tabular-nums';

export function Line({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${MONEY} ${tone === 'danger' ? 'text-error-700' : ''}`}>{formatCurrency(value)}</span>
    </div>
  );
}

/** Desglose plegado por defecto: lo necesario arriba y el detalle a pedido. */
export function Fold({ summary, testId, children }: { summary: string; testId?: string; children: ReactNode }) {
  return (
    <details className="group mt-1" data-testid={testId}>
      <summary className="cursor-pointer select-none text-xs text-primary hover:underline">{summary}</summary>
      <div className="mt-2 space-y-1 border-l-2 pl-3">{children}</div>
    </details>
  );
}

export function SummaryBlock({ title, amount, tone = 'default', testId, children }: {
  title: string;
  amount: number;
  tone?: 'default' | 'danger' | 'primary';
  testId?: string;
  children: ReactNode;
}) {
  const frame = tone === 'primary' ? 'border-primary/30 bg-primary/5' : 'bg-card';
  return (
    <div className={`flex-1 rounded-lg border p-4 ${frame}`}>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p data-testid={testId} className={`${MONEY} text-2xl font-semibold ${tone === 'danger' ? 'text-error-700' : ''}`}>
        {formatCurrency(amount)}
      </p>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}
