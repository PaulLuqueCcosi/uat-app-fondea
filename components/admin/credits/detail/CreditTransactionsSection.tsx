import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowDownLeft, ArrowUpRight, AlertTriangle, RotateCcw, Banknote } from 'lucide-react';
import type { AdminCreditTransactions } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  data: AdminCreditTransactions;
}

const TX_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Wallet }> = {
  DISBURSEMENT: { label: 'Desembolso', color: 'text-blue-700', bg: 'bg-blue-50', icon: ArrowUpRight },
  REPAYMENT: { label: 'Pago de cuota', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: ArrowDownLeft },
  PENALTY_ACCRUAL: { label: 'Mora generada', color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
  PENALTY_PAYMENT: { label: 'Pago de mora', color: 'text-orange-700', bg: 'bg-orange-50', icon: Banknote },
  REVERSAL: { label: 'Reversión', color: 'text-red-700', bg: 'bg-red-50', icon: RotateCcw },
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function CreditTransactionsSection({ data }: Props) {
  // Summary
  const totalRepaid = data.transactions
    .filter(tx => tx.type === 'REPAYMENT' && !tx.is_reversed)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalPenaltyPaid = data.transactions
    .filter(tx => tx.type === 'PENALTY_PAYMENT' && !tx.is_reversed)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      {data.transactions.length > 0 && (
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span className="text-muted-foreground">
            {data.transactions.length} movimiento{data.transactions.length !== 1 ? 's' : ''}
          </span>
          {totalRepaid > 0 && (
            <span className="text-muted-foreground">
              Pagos cuota: <span className="font-medium text-emerald-600">{formatCurrency(totalRepaid)}</span>
            </span>
          )}
          {totalPenaltyPaid > 0 && (
            <span className="text-muted-foreground">
              Pagos mora: <span className="font-medium text-orange-600">{formatCurrency(totalPenaltyPaid)}</span>
            </span>
          )}
        </div>
      )}

      <Card>
        <CardContent className={data.transactions.length === 0 ? 'py-8' : 'p-0'}>
          {data.transactions.length === 0 ? (
            <div className="text-center">
              <Wallet className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Sin transacciones registradas</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.transactions.map((tx) => {
                const config = TX_TYPE_CONFIG[tx.type] ?? { label: tx.type, color: 'text-foreground', bg: 'bg-muted', icon: Wallet };
                const Icon = config.icon;
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        {tx.is_reversed && <Badge variant="destructive" className="text-[9px]">Revertida</Badge>}
                        {tx.installment_no && (
                          <span className="text-[10px] text-muted-foreground font-mono">Cuota #{tx.installment_no}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        <span>{formatDateTime(tx.processed_at ?? tx.transaction_date)}</span>
                        {tx.payment_method && <><span>·</span><span>{tx.payment_method}</span></>}
                        {tx.reference_number && <><span>·</span><span className="font-mono">{tx.reference_number}</span></>}
                        {tx.bank_name && <><span>·</span><span>{tx.bank_name}</span></>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold font-mono ${
                        tx.type === 'REPAYMENT' || tx.type === 'PENALTY_PAYMENT' ? 'text-emerald-600' :
                        tx.type === 'DISBURSEMENT' ? 'text-blue-600' :
                        tx.type === 'REVERSAL' ? 'text-red-600' : ''
                      }`}>
                        {tx.type === 'REPAYMENT' || tx.type === 'PENALTY_PAYMENT' ? '+' : ''}
                        {formatCurrency(tx.amount)}
                      </p>
                      {tx.created_by && <p className="text-[10px] text-muted-foreground">{tx.created_by}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
