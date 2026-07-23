import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';

interface CreditInfoGridProps {
  data: AdminCreditFullDetail;
}

export function CreditInfoGrid({ data }: CreditInfoGridProps) {
  const rows = [
    { label: 'Plazo', value: `${data.term_days} días` },
    { label: 'Cuotas', value: `${data.installment_count}` },
    { label: 'Tasa de interés', value: `${data.interest_rate}%` },
    { label: 'Desembolso', value: data.disbursed_at ? new Date(data.disbursed_at).toLocaleDateString('es-PE') : '—' },
    { label: '1ra cuota', value: new Date(data.first_due_date).toLocaleDateString('es-PE') },
    { label: 'Vencimiento', value: new Date(data.maturity_date).toLocaleDateString('es-PE') },
    {
      label: 'Días restantes',
      value: data.status === 'PAID_OFF'
        ? 'Liquidado'
        : data.days_remaining > 0
          ? `${data.days_remaining} días`
          : data.days_remaining < 0
            ? `${Math.abs(data.days_remaining)} días de mora`
            : 'Vence hoy',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Información del crédito</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {rows.map((row) => (
            <div key={row.label}>
              <p className="text-xs text-muted-foreground mb-0.5">{row.label}</p>
              <p className={`font-medium ${row.label.includes('mora') ? 'text-red-600' : ''}`}>{row.value}</p>
            </div>
          ))}
        </div>
        {data.overdue_since && (
          <>
            <Separator className="my-3" />
            <p className="text-sm text-red-600">
              En mora desde: {new Date(data.overdue_since).toLocaleDateString('es-PE')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
