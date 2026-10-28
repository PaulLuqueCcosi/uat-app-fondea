import { formatCurrency, formatDate } from '@/lib/admin-formatters';
import { bucketLabel } from '@/modules/shared/fee-labels';
import type { PaymentTraceGroup } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  payments: PaymentTraceGroup[];
}

/** `admin:<id>` y `user:<id>` son la convención con la que el backend registra quién hizo el pago. */
function whoPaid(createdBy: string | null): string {
  if (createdBy?.startsWith('admin:')) return 'Registrado por un administrador';
  if (createdBy?.startsWith('user:')) return 'Registrado por el cliente';
  return 'Registrado por el sistema';
}

/**
 * Pagos aplicados a la cuota, del más antiguo al más reciente. Cada pago lista, en el orden de la cascada, a qué
 * concepto entró el dinero, cuánto faltaba antes y cuánto falta después.
 */
export function InstallmentPaymentsCard({ payments }: Props) {
  if (payments.length === 0) {
    return <p className="text-xs text-muted-foreground">Esta cuota todavía no tiene pagos con detalle por concepto</p>;
  }
  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div key={payment.paymentId} className="rounded-md border overflow-hidden" data-testid="installment-payment">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/50 px-3 py-2 text-xs">
            <span className="font-medium">
              {formatDate(payment.transactionDate)} · {formatCurrency(payment.totalApplied)} aplicados a esta cuota
            </span>
            <span className="text-muted-foreground">{whoPaid(payment.createdBy)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left py-1.5 px-3 font-medium">Concepto</th>
                  <th className="text-right py-1.5 px-3 font-medium">Faltaba</th>
                  <th className="text-right py-1.5 px-3 font-medium">Se aplicó</th>
                  <th className="text-right py-1.5 px-3 font-medium">Falta ahora</th>
                </tr>
              </thead>
              <tbody>
                {payment.lines.map((line) => (
                  <tr key={line.position} className="border-t">
                    <td className="py-1.5 px-3">{bucketLabel(line.type, line.concept, line.feeCode)}</td>
                    <td className="py-1.5 px-3 text-right font-mono">{formatCurrency(line.outstandingBefore)}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-medium">{formatCurrency(line.applied)}</td>
                    <td className="py-1.5 px-3 text-right font-mono">{formatCurrency(line.outstandingAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
