import { Card, CardContent } from '@/components/ui/card';
import type { AdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';

interface CreditSummaryCardsProps {
  data: AdminCreditFullDetail;
}

export function CreditSummaryCards({ data }: CreditSummaryCardsProps) {
  const progress = data.total_due > 0
    ? Math.round((data.total_paid / (data.total_due + data.total_penalty)) * 100)
    : 0;

  const items = [
    { label: 'Capital', value: data.principal, color: '' },
    { label: 'Total a pagar', value: data.total_due, color: '' },
    { label: 'Pagado', value: data.total_paid, color: 'text-emerald-600' },
    { label: 'Pendiente', value: data.total_outstanding, color: 'text-amber-600' },
    { label: 'Mora total', value: data.total_penalty, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-3 text-center">
            <p className={`text-lg font-bold ${item.color}`}>
              S/ {Number(item.value).toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="p-3 text-center">
          <p className="text-lg font-bold">{progress}%</p>
          <p className="text-[10px] text-muted-foreground">Avance</p>
          <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
