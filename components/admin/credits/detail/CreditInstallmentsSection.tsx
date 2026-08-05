'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Handshake, ExternalLink, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { AdminCreditInstallments } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  data: AdminCreditInstallments;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon?: typeof CheckCircle2 }> = {
  PENDING: { label: 'Pendiente', variant: 'outline', icon: Clock },
  CURRENT: { label: 'Vigente', variant: 'default', icon: CalendarDays },
  PARTIALLY_PAID: { label: 'Parcial', variant: 'secondary' },
  PAID: { label: 'Pagada', variant: 'default', icon: CheckCircle2 },
  OVERDUE: { label: 'Vencida', variant: 'destructive', icon: AlertTriangle },
  NEGOTIATED: { label: 'Refinanciada', variant: 'secondary', icon: Handshake },
};

const MIN_DAYS_OVERDUE_FOR_NEGOTIATION = 5;

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  const d = new Date(value + (value.includes('T') ? '' : 'T00:00:00'));
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export function CreditInstallmentsSection({ data }: Props) {
  const router = useRouter();

  const paidCount = data.installments.filter(i => i.status === 'PAID').length;
  const overdueCount = data.installments.filter(i => i.status === 'OVERDUE').length;
  const totalOutstanding = data.installments.reduce((sum, i) => sum + i.outstanding, 0);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">
          <span className="font-medium text-emerald-600">{paidCount}</span> pagada{paidCount !== 1 ? 's' : ''}
        </span>
        {overdueCount > 0 && (
          <span className="text-muted-foreground">
            <span className="font-medium text-red-600">{overdueCount}</span> vencida{overdueCount !== 1 ? 's' : ''}
          </span>
        )}
        <span className="text-muted-foreground ml-auto">
          Total pendiente: <span className="font-bold text-foreground">{formatCurrency(totalOutstanding)}</span>
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Vence</th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Pagado</th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Mora</th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Pendiente</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Atraso</th>
                  <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.installments.map((i) => {
                  const sc = STATUS_CONFIG[i.status] ?? { label: i.status, variant: 'outline' as const };
                  const canNegotiate = i.status === 'OVERDUE' && i.days_overdue >= MIN_DAYS_OVERDUE_FOR_NEGOTIATION;
                  const isPaid = i.status === 'PAID';
                  return (
                    <tr
                      key={i.id}
                      className={`border-b last:border-0 cursor-pointer transition-colors ${
                        isPaid ? 'bg-emerald-50/30 hover:bg-emerald-50/60' :
                        i.status === 'OVERDUE' ? 'bg-red-50/30 hover:bg-red-50/60' :
                        'hover:bg-muted/50'
                      }`}
                      onClick={() => router.push(`/admin/credits/${data.credit_id}/installments/${i.installment_no}`)}
                    >
                      <td className="py-2.5 px-3 font-mono text-primary font-bold">{i.installment_no}</td>
                      <td className="py-2.5 px-3">{formatDate(i.due_date)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(i.amount_due)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={i.amount_paid > 0 ? 'text-emerald-600' : ''}>{formatCurrency(i.amount_paid)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={i.penalty_accrued > 0 ? 'text-red-600' : 'text-muted-foreground'}>
                          {i.penalty_accrued > 0 ? formatCurrency(i.penalty_accrued) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {i.outstanding > 0 ? formatCurrency(i.outstanding) : <span className="text-emerald-600">✓</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {i.days_overdue > 0 ? <span className="text-red-600 font-medium">{i.days_overdue}d</span> : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {i.status === 'NEGOTIATED' && i.negotiation_credit_id ? (
                          <Link
                            href={`/admin/credits/${i.negotiation_credit_id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            Ver crédito <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : canNegotiate ? (
                          <Link href={`/admin/credits/${data.credit_id}/installments/${i.installment_no}/negotiate`}>
                            <Button size="sm" variant="outline" className="h-6 gap-1 text-[10px] px-2">
                              <Handshake className="h-3 w-3" />
                              Negociar
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
