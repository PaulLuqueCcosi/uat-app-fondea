'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { InstallmentTransactionInfo, TransactionType } from '@/modules/admin/admin-credit-detail.service';

/**
 * Fechas ya formateadas en el server component padre (no acá) — formatear fechas
 * con toLocaleString dentro de un client component causa hydration mismatch, porque
 * el ICU de Node (SSR) y el del navegador (hidratación) pueden diferir en el espacio
 * antes de "p. m." (narrow no-break space vs espacio normal).
 */
type TransactionForDisplay = InstallmentTransactionInfo & {
  displayDateTime: string;
  displayTransactionDate: string;
};

interface Props {
  transactions: TransactionForDisplay[];
}

const TX_TYPE_LABELS: Record<TransactionType, { label: string; color: string; bg: string }> = {
  DISBURSEMENT: { label: 'Desembolso', color: 'text-blue-700', bg: 'bg-blue-50' },
  REPAYMENT: { label: 'Pago de cuota', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  PENALTY_ACCRUAL: { label: 'Mora generada', color: 'text-amber-700', bg: 'bg-amber-50' },
  PENALTY_PAYMENT: { label: 'Pago de mora', color: 'text-orange-700', bg: 'bg-orange-50' },
  REVERSAL: { label: 'Reversión', color: 'text-red-700', bg: 'bg-red-50' },
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

export function InstallmentTransactionsCard({ transactions }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" /> Transacciones ({transactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Sin movimientos registrados para esta cuota</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionRow({ tx }: { tx: TransactionForDisplay }) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = TX_TYPE_LABELS[tx.type] ?? { label: tx.type, color: 'text-foreground', bg: 'bg-muted' };

  return (
    <div className="rounded-lg border hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 p-3">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${typeConfig.bg}`}>
          <Wallet className={`h-4 w-4 ${typeConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
            {tx.isReversed && <Badge variant="destructive" className="text-[9px]">Revertida</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
            <span>{tx.displayDateTime}</span>
            {tx.paymentMethod && <><span>·</span><span>{tx.paymentMethod}</span></>}
            {tx.referenceNumber && <><span>·</span><span className="font-mono">{tx.referenceNumber}</span></>}
            {tx.bankName && <><span>·</span><span>{tx.bankName}</span></>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold font-mono">{formatCurrency(tx.amount)}</p>
          {tx.createdBy && <p className="text-[10px] text-muted-foreground">{tx.createdBy}</p>}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
          aria-label="Ver detalle"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t px-3 py-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 bg-muted/20">
          <DetailField label="ID completo" value={tx.id} mono />
          <DetailField label="Fecha de transacción" value={tx.displayTransactionDate} />
          <DetailField label="Cuenta origen" value={tx.accountOrigin ?? '—'} mono />
          <DetailField label="Fuente" value={tx.source ?? '—'} />
          <DetailField
            label="Comprobante"
            value={
              tx.receiptUrl ? (
                <a
                  href={tx.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <FileText className="h-3 w-3" /> Ver comprobante
                </a>
              ) : '—'
            }
          />
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-xs font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
