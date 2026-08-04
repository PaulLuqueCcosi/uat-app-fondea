'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Handshake, ExternalLink } from 'lucide-react';
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
  NEGOTIATED: { label: 'Refinanciada', variant: 'secondary' },
};

/**
 * Mínimo de días de mora para habilitar el botón "Negociar" en la UI.
 * El backend valida lo mismo server-side (default 5, configurable) — esto
 * solo evita que el admin intente crear una oferta que el backend rechazaría
 * con 409. No es la fuente de verdad.
 */
const MIN_DAYS_OVERDUE_FOR_NEGOTIATION = 5;

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
                <th className="text-right py-2 font-medium text-muted-foreground">Negociación</th>
              </tr>
            </thead>
            <tbody>
              {data.installments.map((i) => {
                const sc = STATUS_CONFIG[i.status] ?? { label: i.status, variant: 'outline' as const };
                const canNegotiate = i.status === 'OVERDUE' && i.days_overdue >= MIN_DAYS_OVERDUE_FOR_NEGOTIATION;
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
                    <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
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
  );
}
