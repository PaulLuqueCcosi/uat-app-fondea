import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, RotateCcw } from 'lucide-react';
import type { AdminCreditFullDetail, TransactionInfo } from '@/modules/admin/admin-credit-detail.service';

interface CreditTransactionsTableProps {
  data: AdminCreditFullDetail;
}

const TYPE_CONFIG: Record<TransactionInfo['type'], { label: string; icon: typeof ArrowDownLeft; color: string }> = {
  DISBURSEMENT: { label: 'Desembolso', icon: ArrowDownLeft, color: 'text-blue-600' },
  REPAYMENT: { label: 'Pago', icon: ArrowUpRight, color: 'text-emerald-600' },
  PENALTY_ACCRUAL: { label: 'Mora cobrada', icon: AlertTriangle, color: 'text-red-600' },
  PENALTY_PAYMENT: { label: 'Pago de mora', icon: ArrowUpRight, color: 'text-emerald-600' },
  REVERSAL: { label: 'Reverso', icon: RotateCcw, color: 'text-orange-600' },
};

export function CreditTransactionsTable({ data }: CreditTransactionsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Ledger de transacciones</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Monto</TableHead>
              <TableHead className="text-xs">Fecha contable</TableHead>
              <TableHead className="text-xs">Procesado</TableHead>
              <TableHead className="text-xs">Medio / Ref</TableHead>
              <TableHead className="text-xs">Creado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.transactions.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type];
              const Icon = cfg.icon;
              return (
                <TableRow key={tx.id} className={tx.is_reversed ? 'opacity-50' : ''}>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      <span>{cfg.label}</span>
                      {tx.is_reversed && <Badge variant="outline" className="text-[9px]">Reversado</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">S/ {Number(tx.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{new Date(tx.transaction_date).toLocaleDateString('es-PE')}</TableCell>
                  <TableCell className="text-xs">
                    {tx.processed_at ? new Date(tx.processed_at).toLocaleString('es-PE') : '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {tx.payment_method && <span className="block">{tx.payment_method}</span>}
                    {tx.reference_number && <span className="block font-mono text-[10px]">{tx.reference_number}</span>}
                    {tx.bank_name && <span className="block text-[10px] text-muted-foreground">{tx.bank_name}</span>}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{tx.created_by ?? 'system'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
