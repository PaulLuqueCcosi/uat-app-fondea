'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import type { AdminCreditInstallments } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  data: AdminCreditInstallments;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendiente', variant: 'outline' },
  CURRENT: { label: 'Vigente', variant: 'default' },
  PARTIALLY_PAID: { label: 'Parcial', variant: 'secondary' },
  PAID: { label: 'Pagada', variant: 'default' },
  OVERDUE: { label: 'Vencida', variant: 'destructive' },
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export function CreditInstallmentsSection({ data }: Props) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Cuotas ({data.installments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">#</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Vence</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Monto</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Pagado</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Mora</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Pendiente</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Estado</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Días atraso</th>
              </tr>
            </thead>
            <tbody>
              {data.installments.map((i) => {
                const sc = STATUS_CONFIG[i.status] ?? { label: i.status, variant: 'outline' as const };
                return (
                  <tr
                    key={i.id}
                    className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/credits/${data.credit_id}/installments/${i.installment_no}`)}
                  >
                    <td className="py-2 font-mono text-primary font-medium">{i.installment_no}</td>
                    <td className="py-2">{formatDate(i.due_date)}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(i.amount_due)}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(i.amount_paid)}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(i.penalty_accrued)}</td>
                    <td className="py-2 text-right font-mono font-medium">{formatCurrency(i.outstanding)}</td>
                    <td className="py-2 text-center">
                      <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                    </td>
                    <td className="py-2 text-right font-mono">
                      {i.days_overdue > 0 ? <span className="text-red-600">{i.days_overdue}d</span> : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
