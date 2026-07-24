import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet } from 'lucide-react';
import type { AdminCreditTransactions } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  data: AdminCreditTransactions;
}

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  DISBURSEMENT: { label: 'Desembolso', color: 'text-blue-600' },
  REPAYMENT: { label: 'Pago', color: 'text-emerald-600' },
  PENALTY_ACCRUAL: { label: 'Mora cobrada', color: 'text-amber-600' },
  PENALTY_PAYMENT: { label: 'Pago mora', color: 'text-orange-600' },
  REVERSAL: { label: 'Reversión', color: 'text-red-600' },
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function CreditTransactionsSection({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4" /> Transacciones ({data.transactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin transacciones</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Monto</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Cuota</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Método</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Referencia</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Banco</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Creado por</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => {
                  const typeConfig = TX_TYPE_LABELS[tx.type] ?? { label: tx.type, color: '' };
                  return (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2">
                        <span className={`font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                        {tx.is_reversed && <Badge variant="destructive" className="ml-1 text-[9px]">REV</Badge>}
                      </td>
                      <td className="py-2 text-right font-mono">{formatCurrency(tx.amount)}</td>
                      <td className="py-2">{formatDateTime(tx.processed_at ?? tx.transaction_date)}</td>
                      <td className="py-2 text-center font-mono">{tx.installment_no ?? '—'}</td>
                      <td className="py-2">{tx.payment_method ?? '—'}</td>
                      <td className="py-2 font-mono text-[10px]">{tx.reference_number ?? '—'}</td>
                      <td className="py-2">{tx.bank_name ?? '—'}</td>
                      <td className="py-2 text-muted-foreground">{tx.created_by ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
